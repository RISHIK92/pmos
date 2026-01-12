import React, { useContext, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Mock Data
const INITIAL_WATCHLIST = [
  {
    id: "1",
    title: "Inception",
    subtitle: "Sci-Fi • 2h 28m",
    platform: "Netflix",
    progress: 0.7,
    color: "#E50914", // Netflix Red
    gradient: ["#E50914", "#B20710"],
  },
  {
    id: "2",
    title: "Severance",
    subtitle: "Thriller • S2 E3",
    platform: "Apple TV+",
    progress: 0.3,
    color: "#000000", // Apple
    gradient: ["#2C3E50", "#000000"],
  },
  {
    id: "3",
    title: "The Bear",
    subtitle: "Drama • S3 E1",
    platform: "Hulu",
    progress: 0.0,
    color: "#1CE783", // Hulu Green
    gradient: ["#1CE783", "#00A859"],
  },
];

const INITIAL_READING_LIST = [
  {
    id: "10",
    title: "The Future of AI Agents in 2026",
    source: "Medium",
    category: "Tech",
    url: "https://medium.com",
    time: "5 min read",
    read: false,
    icon: "doc.text.fill",
    color: "#000000",
  },
  {
    id: "11",
    title: "React Native: The New Architecture",
    source: "Dev.to",
    category: "Coding",
    url: "https://dev.to",
    time: "12 min read",
    read: true,
    icon: "curlybraces",
    color: "#0984E3",
  },
  {
    id: "12",
    title: "Minimalist Design Principles",
    source: "Smashing Mag",
    category: "Design",
    url: "https://smashingmagazine.com",
    time: "8 min read",
    read: false,
    icon: "paintbrush.fill",
    color: "#E1306C",
  },
];

const INITIAL_SOCIALS = [
  {
    id: "20",
    title: "Twitter",
    type: "Feed",
    notifications: 3,
    url: "https://twitter.com",
    icon: "twitter", // FontAwesome
    color: "#1DA1F2",
    bg: "#F0F9FF",
    saved: [],
  },
  {
    id: "21",
    title: "Instagram",
    type: "Reels",
    notifications: 0,
    url: "https://instagram.com",
    icon: "instagram", // FontAwesome
    color: "#E1306C",
    bg: "#FFF0F5",
    saved: [],
  },
  {
    id: "22",
    title: "LinkedIn",
    type: "Network",
    notifications: 5,
    url: "https://linkedin.com",
    icon: "linkedin", // FontAwesome
    color: "#0077B5",
    bg: "#E3F2FD",
    saved: [] as any[],
  },
];

export default function ContentScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [watchlist, setWatchlist] = useState(INITIAL_WATCHLIST);
  const [readingList, setReadingList] = useState(INITIAL_READING_LIST);
  const [socials, setSocials] = useState(INITIAL_SOCIALS);

  // Pagination State
  const [visibleArticles, setVisibleArticles] = useState(3);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemType, setNewItemType] = useState<"watch" | "read">("read");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState(""); // Used for Platform (Watch) or Source/URL (Read)

  // Social Modal
  const [selectedSocialId, setSelectedSocialId] = useState<string | null>(null);
  const selectedSocial = selectedSocialId
    ? socials.find((s) => s.id === selectedSocialId)
    : null;

  const handleLinkPress = async (url?: string) => {
    if (url) {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    }
  };

  const deleteWatchItem = (id: string) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteReadItem = (id: string) => {
    setReadingList((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteSocialSavedItem = (socialId: string, savedItemId: string) => {
    setSocials((prev) =>
      prev.map((social) => {
        if (social.id === socialId) {
          return {
            ...social,
            saved: social.saved.filter((item) => item.id !== savedItemId),
          };
        }
        return social;
      })
    );
  };

  const addItem = () => {
    if (!newTitle.trim()) return;

    if (newItemType === "watch") {
      const newItem = {
        id: Date.now().toString(),
        title: newTitle,
        subtitle: "To Watch",
        platform: newSubtitle || "Generic",
        progress: 0,
        color: "#95A5A6",
        gradient: ["#95A5A6", "#7F8C8D"],
      };
      setWatchlist([newItem, ...watchlist]);
    } else {
      const newItem = {
        id: Date.now().toString(),
        title: newTitle,
        source: newSubtitle || "Web",
        category: "General",
        url: "https://google.com",
        time: "5 min read",
        read: false,
        icon: "doc.text.fill",
        color: "#000000",
      };
      setReadingList([newItem, ...readingList]);
    }
    setModalVisible(false);
    setNewTitle("");
    setNewSubtitle("");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#2D3436" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setModalVisible(true)}
            >
              <IconSymbol name="plus" size={20} color="#2D3436" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageIntro}>
          <Text style={styles.pageTitle}>Content Hub</Text>
          <Text style={styles.pageSubtitle}>Curated for you</Text>
        </View>

        {/* Watchlist */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.watchlistScroll}
            decelerationRate="fast"
            snapToInterval={200 + 16} // card width + gap
          >
            {watchlist.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInRight.delay(100 + index * 100).springify()}
                style={styles.movieCard}
              >
                {/* Poster Background */}
                <View
                  style={[
                    styles.posterBackground,
                    { backgroundColor: item.gradient[0] },
                  ]}
                >
                  <IconSymbol
                    name="play.circle.fill"
                    size={48}
                    color="rgba(255,255,255,0.8)"
                  />
                </View>

                {/* Info Overlay */}
                <View style={styles.movieInfo}>
                  <View style={styles.platformBadge}>
                    <Text style={styles.platformText}>{item.platform}</Text>
                  </View>
                  <View>
                    <Text style={styles.movieTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.movieSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {item.progress > 0 && (
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${item.progress * 100}%` },
                      ]}
                    />
                  </View>
                )}

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteWatchItem(item.id)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name="xmark"
                    size={16}
                    color="#e74c3c"
                    weight="bold"
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
            <TouchableOpacity
              onPress={() => {
                setNewItemType("watch");
                setModalVisible(true);
              }}
            >
              <Animated.View
                entering={FadeInRight.delay(400).springify()}
                style={[styles.movieCard, styles.addNewCard]}
              >
                <IconSymbol name="plus" size={32} color="#B2BEC3" />
                <Text style={styles.addNewText}>Add New</Text>
              </Animated.View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Reading List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reading List</Text>
          </View>

          <View style={styles.listContainer}>
            {readingList.slice(0, visibleArticles).map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(300 + index * 100)}
              >
                <TouchableOpacity
                  style={styles.articleCard}
                  onPress={() => handleLinkPress(item.url)}
                >
                  <View
                    style={[
                      styles.articleIconBox,
                      {
                        backgroundColor: item.read
                          ? "#F5F6FA"
                          : item.color + "15",
                      },
                    ]}
                  >
                    <IconSymbol
                      name={item.icon as any}
                      size={20}
                      color={item.read ? "#B2BEC3" : item.color}
                    />
                  </View>

                  <View style={styles.articleContent}>
                    <Text
                      style={[
                        styles.articleTitle,
                        item.read && styles.articleTitleRead,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.articleMetaRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                      <Text style={styles.articleSource}>{item.source}</Text>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.articleTime}>{item.time}</Text>
                    </View>
                  </View>

                  {/* Trash Icon */}
                  <TouchableOpacity
                    style={styles.articleDeleteBtn}
                    onPress={() => deleteReadItem(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <IconSymbol name="trash.fill" size={20} color="#FF7675" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}

            {/* Load More Button */}
            {visibleArticles < readingList.length && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => setVisibleArticles((prev) => prev + 3)}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
                <IconSymbol name="arrow.down.left" size={16} color="#0984E3" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Socials */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Social Shortcuts</Text>
          </View>
          <View style={styles.socialGrid}>
            {socials.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(600 + index * 50)}
                style={styles.socialItemWrapper}
              >
                <TouchableOpacity
                  style={styles.socialIconCircle}
                  onPress={() => setSelectedSocialId(item.id)}
                >
                  <FontAwesome
                    name={item.icon as any}
                    size={28}
                    color={item.color}
                  />
                  {item.notifications > 0 && (
                    <View style={styles.notificationDot} />
                  )}
                </TouchableOpacity>
                <Text style={styles.socialLabel}>{item.title}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Content Modal */}
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
              <Text style={styles.modalTitle}>Add Content</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeChip,
                  newItemType === "read" && styles.typeChipActive,
                ]}
                onPress={() => setNewItemType("read")}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    newItemType === "read" && styles.typeChipTextActive,
                  ]}
                >
                  Article / Read
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeChip,
                  newItemType === "watch" && styles.typeChipActive,
                ]}
                onPress={() => setNewItemType("watch")}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    newItemType === "watch" && styles.typeChipTextActive,
                  ]}
                >
                  Video / Watch
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Content Title"
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {newItemType === "watch" ? "Platform" : "Source / Publisher"}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder={
                  newItemType === "watch"
                    ? "e.g. Netflix, YouTube"
                    : "e.g. Medium, Dev.to"
                }
                value={newSubtitle}
                onChangeText={setNewSubtitle}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={addItem}>
              <Text style={styles.saveButtonText}>Save Content</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Social Detail Modal */}
      {selectedSocial && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedSocial}
          onRequestClose={() => setSelectedSocialId(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View
                    style={[
                      styles.modalIconBox,
                      { backgroundColor: selectedSocial.bg },
                    ]}
                  >
                    <FontAwesome
                      name={selectedSocial.icon as any}
                      size={24}
                      color={selectedSocial.color}
                    />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>
                      {selectedSocial.title}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedSocial.type}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedSocialId(null)}
                  style={styles.closeButton}
                >
                  <IconSymbol
                    name="xmark.circle.fill"
                    size={32}
                    color="#dfe6e9"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionTitle}>Saved Items</Text>
              {selectedSocial.saved && selectedSocial.saved.length > 0 ? (
                <View style={styles.savedList}>
                  {selectedSocial.saved.map((savedItem: any) => (
                    <View key={savedItem.id} style={styles.savedItem}>
                      <View
                        style={[
                          styles.savedIconBox,
                          { backgroundColor: selectedSocial.color + "10" },
                        ]}
                      >
                        <IconSymbol
                          name="bookmark.fill"
                          size={16}
                          color={selectedSocial.color}
                        />
                      </View>
                      <View style={styles.savedContent}>
                        <Text style={styles.savedTitle}>{savedItem.title}</Text>
                        <Text style={styles.savedMeta}>
                          {savedItem.type} • {savedItem.time}
                        </Text>
                      </View>

                      {/* Delete Saved Item Button */}
                      <TouchableOpacity
                        onPress={() =>
                          deleteSocialSavedItem(selectedSocial.id, savedItem.id)
                        }
                        style={styles.savedItemDeleteBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <IconSymbol
                          name="minus.circle.fill"
                          size={20}
                          color="#FF7675"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No saved items yet.</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.openAppButton,
                  { backgroundColor: selectedSocial.color },
                ]}
                onPress={() => handleLinkPress(selectedSocial.url)}
              >
                <Text style={styles.openAppText}>
                  Open {selectedSocial.title}
                </Text>
                <IconSymbol name="arrow.up.right" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    padding: 8,
    paddingTop: 30,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
  },
  scrollContent: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  pageIntro: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 4,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "#B2BEC3",
    fontWeight: "500",
  },
  sectionContainer: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
  },

  // Watchlist Styles
  watchlistScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  movieCard: {
    width: 200,
    height: 280,
    borderRadius: 20,
    backgroundColor: "#2D3436",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  addNewCard: {
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    borderStyle: "dashed",
    gap: 12,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B2BEC3",
  },
  posterBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  movieInfo: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: 8,
  },
  platformBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backdropFilter: "blur(10px)",
  },
  platformText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  movieTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  movieSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    width: "100%",
    position: "absolute",
    bottom: 0,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#E50914",
  },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  // Reading List Styles
  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  articleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F2F6",
  },
  articleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  articleContent: {
    flex: 1,
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 6,
  },
  articleTitleRead: {
    color: "#B2BEC3",
    textDecorationLine: "line-through",
  },
  articleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#636E72",
  },
  articleSource: {
    fontSize: 11,
    fontWeight: "500",
    color: "#636E72",
  },
  bulletPoint: {
    marginHorizontal: 4,
    color: "#B2BEC3",
    fontSize: 10,
  },
  articleTime: {
    fontSize: 11,
    color: "#B2BEC3",
  },
  articleDeleteBtn: {
    padding: 4,
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  loadMoreText: {
    color: "#0984E3",
    fontWeight: "600",
  },

  // Social Grid
  socialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 24, // Wider gap for cleaner look
    justifyContent: "flex-start",
  },
  socialItemWrapper: {
    alignItems: "center",
    gap: 8,
  },
  socialIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#636E72",
  },
  notificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF7675",
    borderWidth: 2,
    borderColor: "#FFF",
  },

  // Modal State
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
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F2F6",
    alignItems: "center",
  },
  typeChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636E72",
  },
  typeChipTextActive: {
    color: "#FFF",
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
  modalInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 8,
    minHeight: 40,
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

  // Social Modal Specifics
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#B2BEC3",
  },
  closeButton: {
    padding: 4,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B2BEC3",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  savedList: {
    gap: 12,
    marginBottom: 24,
  },
  savedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 16,
  },
  savedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  savedContent: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 2,
  },
  savedMeta: {
    fontSize: 12,
    color: "#B2BEC3",
  },
  savedItemDeleteBtn: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    marginBottom: 24,
  },
  emptyText: {
    color: "#B2BEC3",
    fontSize: 14,
    fontWeight: "500",
  },
  openAppButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  openAppText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
