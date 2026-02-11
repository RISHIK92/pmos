import React, { useContext, useState, useMemo, useEffect } from "react";
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
import { AutoScrollText } from "@/components/ui/AutoScrollText";
import { SidebarContext } from "./_layout";
import { auth } from "../../lib/firebase";
import Animated, {
  FadeInUp,
  FadeInRight,
  Layout,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
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
    payee: "Apple Store",
    category: "Electronics",
    amount: "-999.00",
    type: "expense",
    date: "Today",
    icon: "laptopcomputer",
    iconBg: "#000000",
  },
  {
    id: "3",
    payee: "Uber Eats",
    category: "Food & Drink",
    amount: "-45.50",
    type: "expense",
    date: "Today",
    icon: "car.fill",
    iconBg: "#0984E3",
  },
  {
    id: "101",
    payee: "Starbucks",
    category: "Coffee",
    amount: "-12.00",
    type: "expense",
    date: "Today",
    icon: "arrow.down.left",
    iconBg: "#00b894",
  },
  {
    id: "2",
    payee: "Salary Deposit",
    category: "Transfer",
    amount: "+2,900.00",
    type: "income",
    date: "Yesterday",
    icon: "banknote",
    iconBg: "#00B894",
  },
  {
    id: "102",
    payee: "Grocery Store",
    category: "Essentials",
    amount: "-150.00",
    type: "expense",
    date: "Yesterday",
    icon: "cart.fill",
    iconBg: "#fdcb6e",
  },
  {
    id: "4",
    payee: "Netflix",
    category: "Entertainment",
    amount: "-15.99",
    type: "expense",
    date: "This Week",
    icon: "play.tv.fill",
    iconBg: "#FF7675",
  },
  {
    id: "5",
    payee: "Freelance",
    category: "Design Work",
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
  payee: string;
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

// Separate component for animated dot to properly use hooks
const AnimatedDot = ({
  index,
  numDots,
  pendingListLength,
  scrollX,
}: {
  index: number;
  numDots: number;
  pendingListLength: number;
  scrollX: SharedValue<number>;
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    if (numDots === 1) return { opacity: 1 };

    const totalWidth = pendingListLength * 176 - (width - 48);
    if (totalWidth <= 0) return { opacity: 1 };

    const segment = totalWidth / (numDots - 1 || 1);
    const center = index * segment;

    const opacity = interpolate(
      scrollX.value,
      [center - segment, center, center + segment],
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );

    return { opacity };
  });

  return <Animated.View style={[styles.dot, animatedDotStyle]} />;
};

export default function FinanceScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Pending State - moved up to follow Rules of Hooks
  const [pendingList, setPendingList] = useState<PendingTransaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeAction, setActiveAction] = useState<any>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");

  // Animation shared values
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const backendUrl =
    Platform.OS === "android"
      ? "https://backend.pmos.rishik.codes"
      : "http://localhost:8000";

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/finance/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Color Presets
  const BANK_COLORS = [
    "#6C5CE7", // Purple
    "#0984E3", // Blue
    "#00B894", // Green
    "#E17055", // Orange
    "#D63031", // Red
    "#2D3436", // Black
  ];

  // Accounts State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [accModalVisible, setAccModalVisible] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");

  const [newAccColor, setNewAccColor] = useState(BANK_COLORS[0]);
  const [hiddenAccountIds, setHiddenAccountIds] = useState<string[]>([]);

  // Edit Transaction State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editPayee, setEditPayee] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit Account State
  const [editAccModalVisible, setEditAccModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccNumber, setEditAccNumber] = useState("");
  const [editAccBalance, setEditAccBalance] = useState("");
  const [editAccColor, setEditAccColor] = useState("");
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  useEffect(() => {
    const total = bankAccounts
      .filter((acc) => !hiddenAccountIds.includes(acc.id))
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);
    setBalance(total);
  }, [bankAccounts, hiddenAccountIds]);

  const fetchAccounts = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/finance/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBankAccounts(data);
      }
    } catch (e) {
      console.error("Failed to fetch accounts", e);
    }
  };

  const createAccount = async () => {
    if (!newAccName || !newAccNumber) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/finance/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAccName,
          accountNumber: newAccNumber,
          balance: 0,
          color: newAccColor,
        }),
      });

      if (res.ok) {
        setAccModalVisible(false);
        setNewAccName("");
        setNewAccNumber("");
        setNewAccColor(BANK_COLORS[0]);
        fetchAccounts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (item: any) => {
    setEditingTransaction(item);
    setEditPayee(item.payee);
    setEditCategory(item.category || "");
    setEditModalVisible(true);
  };

  const updateTransaction = async () => {
    if (!editingTransaction) return;
    try {
      setIsUpdating(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(
        `${backendUrl}/finance/transactions/${editingTransaction.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payee: editPayee,
            category: editCategory,
          }),
        },
      );

      if (res.ok) {
        setEditModalVisible(false);
        fetchTransactions(); // Refresh
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Edit Account Logic
  const handleEditAccount = (acc: any) => {
    setEditingAccount(acc);
    setEditAccName(acc.name);
    setEditAccNumber(acc.accountNumber);
    setEditAccBalance(acc.balance.toString());
    setEditAccColor(acc.color);
    setEditAccModalVisible(true);
  };

  const updateAccount = async () => {
    if (!editingAccount) return;
    try {
      setIsUpdatingAccount(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const targetBal = parseFloat(editAccBalance);
      const initialBalToStore = isNaN(targetBal) ? 0 : targetBal;

      const res = await fetch(
        `${backendUrl}/finance/accounts/${editingAccount.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editAccName,
            accountNumber: editAccNumber,
            balance: initialBalToStore,
            color: editAccColor,
          }),
        },
      );

      if (res.ok) {
        setEditAccModalVisible(false);
        fetchAccounts(); // Refresh
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchPendingItems();
    fetchAccounts();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/finance/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const visibleData = useMemo(
    () => transactions.slice(0, visibleCount),
    [visibleCount, transactions],
  );
  const groupedSections = useMemo(
    () => groupTransactions(visibleData),
    [visibleData],
  );

  const numDots = useMemo(
    () =>
      pendingList.length < 2
        ? 0
        : Math.min(6, Math.ceil(pendingList.length / 2)),
    [pendingList.length],
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

  const addToPending = async () => {
    if (!formAmount || !formName) {
      Alert.alert("Missing Info", "Please enter amount and name.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const newItem = {
        amount: formAmount,
        payee: formName,
        category: formCategory || "General",
        type: activeAction.type,
        actionLabel: activeAction.label,
      };

      const res = await fetch(`${backendUrl}/finance/pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        setModalVisible(false);
        fetchPendingItems();
      }
    } catch (error) {
      console.error("Failed to add pending", error);
    }
  };

  const executePending = async (item: PendingTransaction) => {
    // Optimistic Update
    const val = parseFloat(item.amount);
    if (isNaN(val)) return;

    // Remove from pending locally first (optimistic)
    setPendingList((prev) => prev.filter((p) => p.id !== item.id));

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await fetch(`${backendUrl}/finance/pending/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const transactionData = {
        payee: item.payee,
        category: item.category,
        amount: parseFloat(item.amount),
        type: item.type,
        excludeFromBalance: true,
        icon:
          item.actionLabel === "Bills"
            ? "doc.text.fill"
            : item.type === "income"
              ? "arrow.down.left"
              : "paperplane.fill",
        iconBg: item.type === "income" ? "#00B894" : "#2D3436",
      };

      const res = await fetch(`${backendUrl}/finance/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (res.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error("Failed to execute transaction", error);
    }
  };

  const deletePending = async (id: string) => {
    // Optimistic
    setPendingList((prev) => prev.filter((p) => p.id !== id));

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await fetch(`${backendUrl}/finance/pending/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Failed to delete pending", error);
      fetchPendingItems(); // Revert
    }
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

      {/* Accounts Section */}
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 2,
            marginBottom: 12,
          }}
        >
          <Text style={styles.sectionTitle}>My Accounts</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, gap: 12 }}
        >
          {bankAccounts.map((acc, index) => (
            <TouchableOpacity
              key={acc.id}
              onLongPress={() => handleEditAccount(acc)}
              activeOpacity={0.8}
              style={{
                width: 140,
                height: 84,
                backgroundColor: acc.color || "#6C5CE7",
                borderRadius: 20,
                padding: 14,
                justifyContent: "space-between",
                shadowColor: acc.color || "#6C5CE7",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    fontSize: 14,
                    flex: 1,
                    marginRight: 4,
                  }}
                  numberOfLines={1}
                >
                  {acc.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (hiddenAccountIds.includes(acc.id)) {
                      setHiddenAccountIds((prev) =>
                        prev.filter((id) => id !== acc.id),
                      );
                    } else {
                      setHiddenAccountIds((prev) => [...prev, acc.id]);
                    }
                  }}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 12,
                    padding: 4,
                  }}
                >
                  <IconSymbol
                    name={
                      hiddenAccountIds.includes(acc.id)
                        ? ("eye.slash.fill" as any)
                        : ("eye.fill" as any)
                    }
                    size={12}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              <View>
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 16 }}
                >
                  ₹{(acc.balance || 0).toLocaleString("en-IN")}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 10,
                    marginBottom: 2,
                    fontWeight: "500",
                  }}
                >
                  •••• {acc.accountNumber}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setAccModalVisible(true)}
            style={{
              width: 50,
              height: 84,
              backgroundColor: "#FFF",
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#F1F2F6",
              borderStyle: "dashed",
            }}
          >
            <IconSymbol name="plus" size={24} color="#B2BEC3" />
          </TouchableOpacity>
        </ScrollView>
      </View>

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
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pendingList}
            style={{ marginHorizontal: -24 }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
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
                    <AutoScrollText
                      text={item.payee}
                      style={styles.pendingName}
                      threshold={15}
                    />
                    <AutoScrollText
                      text={item.category}
                      style={styles.pendingCategory}
                      threshold={15}
                    />
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={[styles.pendingBtnPay, { width: "100%" }]}
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
          </Animated.ScrollView>

          {/* Dotted Scroll Indicator */}
          {numDots > 0 && (
            <View style={styles.dotsContainer}>
              {Array.from({ length: numDots }).map((_, index) => (
                <AnimatedDot
                  key={index}
                  index={index}
                  numDots={numDots}
                  pendingListLength={pendingList.length}
                  scrollX={scrollX}
                />
              ))}

              {pendingList.length > 12 && (
                <Text style={styles.plusIndicator}>+</Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Transactions</Text>
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
        renderItem={(props) =>
          renderTransactionItem({ ...props, onPress: handleEdit })
        }
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading transactions...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="banknote" size={48} color="#D1D8E0" />
              <Text style={styles.emptyStateText}>No transactions found</Text>
            </View>
          )
        }
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
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeAction?.label || "New Item"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount (₹)"
              placeholderTextColor="#B2BEC3"
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            <TextInput
              style={styles.input}
              placeholder="Payee (e.g. Alex)"
              placeholderTextColor="#B2BEC3"
              value={formName}
              onChangeText={setFormName}
            />

            <TextInput
              style={styles.input}
              placeholder="Name (e.g. Lunch)"
              placeholderTextColor="#B2BEC3"
              value={formCategory}
              onChangeText={setFormCategory}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={addToPending}>
              <Text style={styles.submitBtnText}>Add to Pending</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={accModalVisible}
        onRequestClose={() => setAccModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Account</Text>
              <TouchableOpacity onPress={() => setAccModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Bank Name (e.g. HDFC)"
              placeholderTextColor="#B2BEC3"
              value={newAccName}
              onChangeText={setNewAccName}
            />

            <TextInput
              style={styles.input}
              placeholder="Last 4 Digits"
              placeholderTextColor="#B2BEC3"
              keyboardType="numeric"
              maxLength={4}
              value={newAccNumber}
              onChangeText={setNewAccNumber}
            />

            {/* Color Picker Section */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#B2BEC3",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Card Color
              </Text>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                {BANK_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setNewAccColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color,
                      borderWidth: newAccColor === color ? 2 : 0,
                      borderColor: "white",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {newAccColor === color && (
                      <IconSymbol name="checkmark" size={16} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={createAccount}>
              <Text style={styles.submitBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Payee"
              placeholderTextColor="#B2BEC3"
              value={editPayee}
              onChangeText={setEditPayee}
            />

            <TextInput
              style={styles.input}
              placeholder="Category"
              placeholderTextColor="#B2BEC3"
              value={editCategory}
              onChangeText={setEditCategory}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={updateTransaction}
              disabled={isUpdating}
            >
              <Text style={styles.submitBtnText}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Edit Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editAccModalVisible}
        onRequestClose={() => setEditAccModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Account</Text>
              <TouchableOpacity onPress={() => setEditAccModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Account Name"
              placeholderTextColor="#B2BEC3"
              value={editAccName}
              onChangeText={setEditAccName}
            />

            <TextInput
              style={styles.input}
              placeholder="Last 4 Digits"
              placeholderTextColor="#B2BEC3"
              keyboardType="numeric"
              maxLength={4}
              value={editAccNumber}
              onChangeText={setEditAccNumber}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Balance</Text>
              <TextInput
                style={styles.modalInputLg}
                placeholder="0.00"
                placeholderTextColor="#B2BEC3"
                keyboardType="numeric"
                value={editAccBalance}
                onChangeText={setEditAccBalance}
              />
            </View>

            {/* Color Picker Section */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#B2BEC3",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Card Color
              </Text>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                {BANK_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setEditAccColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color,
                      borderWidth: editAccColor === color ? 2 : 0,
                      borderColor: "white",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {editAccColor === color && (
                      <IconSymbol name="checkmark" size={16} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={updateAccount}
              disabled={isUpdatingAccount}
            >
              <Text style={styles.submitBtnText}>
                {isUpdatingAccount ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const renderTransactionItem = ({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress?: (item: any) => void;
}) => (
  <TouchableOpacity
    onPress={() => onPress && onPress(item)}
    activeOpacity={0.7}
  >
    <Animated.View
      entering={FadeInUp.delay(300 + (index % 5) * 50)}
      style={styles.transactionItem}
    >
      <View style={styles.transactionLeft}>
        <View style={styles.iconCircle}>
          <IconSymbol name={item.icon as any} size={18} color="#000" />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <AutoScrollText
            text={item.payee}
            style={styles.transactionTitle}
            threshold={15}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              maxWidth: "100%",
            }}
          >
            <AutoScrollText
              text={item.category}
              style={styles.transactionSubtitle}
              threshold={15}
              containerStyle={{ flexShrink: 1 }}
            />
            {item.account && (
              <View
                style={{
                  backgroundColor: (item.account.color || "#000") + "20",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: item.account.color || "#000",
                    fontWeight: "700",
                  }}
                >
                  {item.account.name} • {item.account.accountNumber}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.type === "income" ? "#00B894" : "#000" },
        ]}
      >
        {item.type === "expense" ? "-" : "+"}₹
        {typeof item.amount === "number"
          ? item.amount.toFixed(2)
          : item.amount.replace(/[-+]/g, "").replace(/[₹,]/g, "")}
      </Text>
    </Animated.View>
  </TouchableOpacity>
);

const renderSectionHeader = ({ section: { title } }: any) => (
  <View style={styles.sectionHeaderBox}>
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
  </View>
);
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
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 1,
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
    paddingRight: 84,
    paddingLeft: 14,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  input: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 8,
    marginBottom: 24,
    height: 40,
  },
  submitBtn: {
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
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
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2D3436",
  },
  plusIndicator: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
    marginLeft: 2,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B2BEC3",
  },
});
