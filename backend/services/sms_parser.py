import os
import json
from google import genai
from typing import Optional
import re

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PARSE_SMS_PROMPT = """
You are a financial SMS parser. Extract transaction details from the following bank SMS.

SMS Content:
"{sms_body}"

Sender: {sender}

User's registered account numbers (last 4 digits): {account_numbers}

INSTRUCTIONS:
1. If this is NOT a financial transaction SMS (e.g., OTP, promotional, balance inquiry), return: {{"is_transaction": false}}
2. If this IS a transaction, extract and return:

{{
  "is_transaction": true,
  "amount": 0.00,
  "type": "debit",
  "merchant": "Unknown",
  "account_last_4": "0000",
  "category": "Other"
}}

Replace values with actual data from SMS.

RULES:
- "debited", "spent", "paid", "sent" → type: "debit"
- "credited", "received", "refund" → type: "credit"
- amount must be a number (no currency symbols)
- account_last_4 must be exactly 4 digits from the SMS
- category options: Food, Shopping, Transport, Bills, Entertainment, Health, Transfer, Salary, Other
- Return ONLY valid JSON, no markdown blocks, no explanations, no extra text
"""

async def parse_sms_with_gemini(
    sms_body: str,
    sender: str,
    user_accounts: list
) -> Optional[dict]:
    
    try:
        # Build account numbers string for the prompt
        account_numbers_str = ", ".join([acc.get("accountNumber", "") for acc in user_accounts])
        if not account_numbers_str:
            account_numbers_str = "None registered"
        
        # Build account lookup map
        account_map = {acc.get("accountNumber"): acc.get("id") for acc in user_accounts}
        
        prompt = PARSE_SMS_PROMPT.format(
            sms_body=sms_body,
            sender=sender,
            account_numbers=account_numbers_str
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.1,  # More deterministic
                "response_mime_type": "application/json"  # Force JSON response
            }
        )
        
        raw_text = response.text.strip()
        print(f"Gemini raw response: {raw_text}")  # Full debug log
        
        # Aggressive cleanup
        # Remove markdown code blocks
        raw_text = re.sub(r'```(?:json)?', '', raw_text)
        raw_text = raw_text.strip()
        
        # Remove any text before/after JSON object
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            raw_text = json_match.group(0)
        
        # Fix common JSON issues
        # Replace single quotes with double quotes (if present)
        raw_text = raw_text.replace("'", '"')
        
        # Remove trailing commas before closing braces/brackets
        raw_text = re.sub(r',(\s*[}\]])', r'\1', raw_text)
        
        print(f"Cleaned JSON: {raw_text}")
        
        # Parse JSON
        data = json.loads(raw_text)
        
        # Check if it's a transaction
        is_transaction = data.get("is_transaction", False)
        
        if not is_transaction:
            print(f"SMS marked as not a transaction by Gemini")
            return None
        
        # Try to match account
        account_last_4 = str(data.get("account_last_4", "")).strip()
        matched_account_id = None
        
        if account_last_4:
            # Try exact match first
            if account_last_4 in account_map:
                matched_account_id = account_map[account_last_4]
            else:
                # Try to find partial match (in case Gemini extracted more than last 4)
                for acc_num, acc_id in account_map.items():
                    if acc_num.endswith(account_last_4) or account_last_4.endswith(acc_num):
                        matched_account_id = acc_id
                        break
        
        # Get amount
        try:
            amount = float(data.get("amount", 0))
        except (ValueError, TypeError):
            # Try to extract number from string
            amount_str = str(data.get("amount", "0"))
            amount_match = re.search(r'[\d,]+\.?\d*', amount_str.replace(',', ''))
            amount = float(amount_match.group(0)) if amount_match else 0.0
        
        result = {
            "amount": amount,
            "type": "expense" if data.get("type") == "debit" else "income",
            "merchant": data.get("merchant", "Unknown").strip(),
            "category": data.get("category", "Other").strip(),
            "account_id": matched_account_id,
            "account_last_4": account_last_4
        }
        
        print(f"Gemini parsed result: {result}")
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw text: {raw_text if 'raw_text' in locals() else 'N/A'}")
        return None
    except KeyError as e:
        print(f"Missing key in response: {e}")
        print(f"Data received: {data if 'data' in locals() else 'N/A'}")
        return None
    except Exception as e:
        print(f"Gemini SMS parsing error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None