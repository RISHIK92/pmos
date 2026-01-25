import os
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

class SMSExtraction(BaseModel):
    """Schema for extracting financial transaction details from SMS."""
    is_transaction: bool = Field(
        description="Set to False if this is an OTP, promo, or balance inquiry. True only for actual money movement."
    )
    amount: float = Field(
        default=0.0, 
        description="The numeric amount of the transaction. No currency symbols."
    )
    type: Literal["debit", "credit"] = Field(
        default="debit", 
        description="'debit' for spent/paid/sent, 'credit' for received/refunds"
    )
    merchant: str = Field(
        default="Unknown",
        description="The name of the entity, person, or shop the money was sent to or received from."
    )
    account_last_4: str = Field(
        default="0000",
        description="The 4 digits representing the bank account found in the text."
    )
    category: Literal["Food", "Shopping", "Transport", "Bills", "Entertainment", "Health", "Transfer", "Salary", "Other"] = Field(
        default="Other",
        description="Categorize the transaction based on the merchant."
    )

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.0,
    max_retries=2,
)

structured_llm = llm.with_structured_output(SMSExtraction)

prompt_template = ChatPromptTemplate.from_messages([
    ("system", """You are an expert financial parser. 
    Analyze the incoming SMS against the user's known accounts: {account_numbers}.
    
    If the SMS mentions an account number NOT in the list, extract it anyway.
    Focus on accuracy for the 'amount' and 'merchant' fields.
    """),
    ("human", "{sms_body}"),
])

# 5. Create the Chain
chain = prompt_template | structured_llm

async def parse_sms(
    sms_body: str, 
    user_accounts: List[dict]
) -> Optional[dict]:
    
    try:
        account_map = {acc.get("accountNumber"): acc.get("id") for acc in user_accounts}
        account_numbers_str = ", ".join(account_map.keys()) or "None registered"

        result: SMSExtraction = await chain.ainvoke({
            "sms_body": sms_body,
            "account_numbers": account_numbers_str
        })

        if not result.is_transaction:
            print(f"Skipping: marked as non-transaction.")
            return None

        matched_account_id = None
        extracted_acc = result.account_last_4.strip()

        if extracted_acc in account_map:
            matched_account_id = account_map[extracted_acc]
        else:
            for acc_num, acc_id in account_map.items():
                if acc_num.endswith(extracted_acc) or extracted_acc.endswith(acc_num):
                    matched_account_id = acc_id
                    break

        return {
            "amount": result.amount,
            "type": "expense" if result.type == "debit" else "income",
            "merchant": result.merchant,
            "category": result.category,
            "account_id": matched_account_id,
            "account_last_4": extracted_acc
        }

    except Exception as e:
        print(f"LangChain Extraction Error: {e}")
        return None