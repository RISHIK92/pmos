import React, { useContext, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  SectionList,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, {
  FadeInUp,
  FadeInRight,
  Layout,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Mock Data
const BASE_BALANCE = 12450.0;

const QUICK_ACTIONS = [
  { id: "send", label: "Send", icon: "paperplane.fill", type: "expense" },
  { id: "request", label: "Request", icon: "arrow.down.left", type: "income" },
  { id: "bills", label: "Bills", icon: "doc.text.fill", type: "expense" },
];

const BASE_TRANSACTIONS = [
  {
    id: "1",
    title: "Apple Store",
    subtitle: "Electronics",
    amount: "-999.00",
    type: "expense",
    date: "Today",
    icon: "laptopcomputer",
    iconBg: "#000000",
  },
  {
    id: "3",
    title: "Uber Eats",
    subtitle: "Food & Drink",
    amount: "-45.50",
    type: "expense",
    date: "Today",
    icon: "car.fill",
    iconBg: "#0984E3",
  },
  {
    id: "101",
    title: "Starbucks",
    subtitle: "Coffee",
    amount: "-12.00",
    type: "expense",
    date: "Today",
    icon: "arrow.down.left",
    iconBg: "#00b894",
  },
  {
    id: "2",
    title: "Salary Deposit",
    subtitle: "Transfer",
    amount: "+2,900.00",
    type: "income",
    date: "Yesterday",
    icon: "banknote",
    iconBg: "#00B894",
  },
  {
    id: "102",
    title: "Grocery Store",
    subtitle: "Essentials",
    amount: "-150.00",
    type: "expense",
    date: "Yesterday",
    icon: "cart.fill",
    iconBg: "#fdcb6e",
  },
  {
    id: "4",
    title: "Netflix",
    subtitle: "Entertainment",
    amount: "-15.99",
    type: "expense",
    date: "This Week",
    icon: "play.tv.fill",
    iconBg: "#FF7675",
  },
  {
    id: "5",
    title: "Freelance",
    subtitle: "Design Work",
    amount: "+850.00",
    type: "income",
    date: "This Week",
    icon: "briefcase.fill",
    iconBg: "#6C5CE7",
  },
];

const ALL_TRANSACTIONS_INIT = [
  ...BASE_TRANSACTIONS,
  ...BASE_TRANSACTIONS.map((item) => ({
    ...item,
    id: item.id + "_2",
    date: "Earlier",
  })),
];

type PendingTransaction = {
  id: string;
  amount: string;
  name: string;
  category: string;
  type: "income" | "expense";
  actionLabel: string; // 'Bills', 'Send', 'Request'
};

const groupTransactions = (transactions: any[]) => {
  const groups: { [key: string]: any[] } = {};
  transactions.forEach((item) => {
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  });
  return Object.keys(groups).map((date) => ({
    title: date,
    data: groups[date],
  }));
};

export default function FinanceScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [transactions, setTransactions] = useState(ALL_TRANSACTIONS_INIT);
  const [balance, setBalance] = useState(BASE_BALANCE);
  const [visibleCount, setVisibleCount] = useState(10);

  // Pending State
  const [pendingList, setPendingList] = useState<PendingTransaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeAction, setActiveAction] = useState<any>(null);

  // Example Form State
  const [formAmount, setFormAmount] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");

  const visibleData = useMemo(
    () => transactions.slice(0, visibleCount),
    [visibleCount, transactions]
  );
  const groupedSections = useMemo(
    () => groupTransactions(visibleData),
    [visibleData]
  );

  const handleLoadMore = () => {
    if (visibleCount < transactions.length)
      setVisibleCount((prev) => prev + 10);
  };

  const openModal = (action: any) => {
    setActiveAction(action);
    setFormAmount("");
    setFormName("");
    setFormCategory("");
    setModalVisible(true);
  };

  const addToPending = () => {
    if (!formAmount || !formName) {
      Alert.alert("Missing Info", "Please enter amount and name.");
      return;
    }

    const newItem: PendingTransaction = {
      id: Date.now().toString(),
      amount: formAmount,
      name: formName,
      category: formCategory || "General",
      type: activeAction.type,
      actionLabel: activeAction.label,
    };

    setPendingList((prev) => [newItem, ...prev]);
    setModalVisible(false);
  };

  const executePending = (item: PendingTransaction) => {
    // Update Balance
    const val = parseFloat(item.amount);
    if (isNaN(val)) return;

    const newItems = transactions.filter(() => true); // clone
    const newTrans = {
      id: Date.now().toString(),
      title: item.name,
      subtitle: item.category,
      amount: (item.type === "expense" ? "-" : "+") + item.amount,
      type: item.type,
      date: "Just Now",
      icon:
        item.actionLabel === "Bills"
          ? "doc.text.fill"
          : item.type === "income"
          ? "arrow.down.left"
          : "paperplane.fill",
      iconBg: item.type === "income" ? "#00B894" : "#2D3436",
    };

    setTransactions([newTrans, ...transactions]);
    setBalance((prev) => (item.type === "income" ? prev + val : prev - val));

    // Remove from pending
    setPendingList((prev) => prev.filter((p) => p.id !== item.id));
  };

  const deletePending = (id: string) => {
    setPendingList((prev) => prev.filter((p) => p.id !== id));
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Big Balance */}
      <Animated.View
        entering={FadeInUp.delay(100).springify()}
        style={styles.balanceSection}
      >
        <Text style={styles.currencyLabel}>Total Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.balanceText}>
            {balance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
        <View style={styles.trendPill}>
          <IconSymbol name="arrow.up.right" size={12} color="#00B894" />
          <Text style={styles.trendText}>+2.5% this month</Text>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        {QUICK_ACTIONS.map((action, index) => (
          <Animated.View
            key={action.id}
            entering={FadeInRight.delay(200 + index * 50)}
          >
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => openModal(action)}
            >
              <View style={styles.actionIconCircle}>
                <IconSymbol name={action.icon as any} size={20} color="#000" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Pending Items Section */}
      {pendingList.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pendingList}
            style={{ marginHorizontal: -24 }}
          >
            {pendingList.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInRight.delay(index * 100).springify()}
                layout={Layout.springify()}
              >
                <View style={styles.pendingCard}>
                  <View style={styles.pendingHeader}>
                    <View
                      style={[
                        styles.pendingIcon,
                        {
                          backgroundColor:
                            item.type === "income" ? "#00B894" : "#2D3436",
                        },
                      ]}
                    >
                      <IconSymbol
                        name={
                          item.actionLabel === "Bills"
                            ? "doc.text.fill"
                            : ("paperplane.fill" as any)
                        }
                        size={14}
                        color="#FFF"
                      />
                    </View>
                    <Text style={styles.pendingAmount}>₹{item.amount}</Text>
                  </View>
                  <View style={styles.pendingBody}>
                    <Text style={styles.pendingName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.pendingCategory}>{item.category}</Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.pendingBtnDelete}
                      onPress={() => deletePending(item.id)}
                    >
                      <IconSymbol name="trash.fill" size={16} color="#B2BEC3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pendingBtnPay}
                      onPress={() => executePending(item)}
                    >
                      <Text style={styles.payBtnText}>
                        {item.type === "income" ? "Received" : "Paid"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Transactions</Text>
    </View>
  );

  const renderTransactionItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInUp.delay(300 + (index % 5) * 50)}
      style={styles.transactionItem}
    >
      <View style={styles.transactionLeft}>
        <View style={styles.iconCircle}>
          <IconSymbol name={item.icon as any} size={18} color="#000" />
        </View>
        <View>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.type === "income" ? "#00B894" : "#000" },
        ]}
      >
        {item.type === "expense" ? "-" : "+"}₹
        {item.amount.replace(/[-+]/g, "").replace(/[₹,]/g, "")}
      </Text>
    </Animated.View>
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={styles.sectionHeaderBox}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Fixed Nav */}
      <SafeAreaView style={styles.navContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.navButton}>
            <IconSymbol name="line.3.horizontal" size={24} color="#000" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
      </SafeAreaView>

      <SectionList
        sections={groupedSections}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        stickySectionHeadersEnabled={false}
      />

      {/* Add Pending Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {activeAction?.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.modalInputLg}
                placeholder="0"
                keyboardType="number-pad"
                value={formAmount}
                onChangeText={setFormAmount}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Person / Merchant</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Name"
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Type / Category</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. UPI, Electricity, Rent"
                value={formCategory}
                onChangeText={setFormCategory}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={addToPending}>
              <Text style={styles.saveButtonText}>Add to Pending</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  navContainer: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
    paddingTop: 30,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContent: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  // Balance Section
  balanceSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B2BEC3",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "300",
    color: "#B2BEC3",
    marginTop: 8,
    marginRight: 4,
  },
  balanceText: {
    fontSize: 56,
    fontWeight: "200",
    color: "#000",
    fontVariant: ["tabular-nums"],
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00B894",
  },

  // Action Row
  actionsRow: {
    gap: 24,
    paddingHorizontal: 8,
    justifyContent: "center",
    width: "100%",
    marginBottom: 32,
  },
  actionItem: {
    alignItems: "center",
    gap: 8,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F2F6",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2D3436",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F2F6",
    marginBottom: 32,
    marginHorizontal: -24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.5,
  },

  // Pending Styles
  pendingSection: {
    marginBottom: 32,
  },
  pendingList: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  pendingCard: {
    width: 160,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginRight: 16,
  },
  pendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pendingIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  pendingBody: {
    marginBottom: 16,
  },
  pendingName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 4,
  },
  pendingCategory: {
    fontSize: 12,
    color: "#B2BEC3",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8,
  },
  pendingBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBtnPay: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // Clean List Styles
  sectionHeaderBox: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B2BEC3",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  transactionSubtitle: {
    fontSize: 13,
    color: "#B2BEC3",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  modalInputLg: {
    fontSize: 40,
    fontWeight: "700",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 8,
    height: 40,
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
