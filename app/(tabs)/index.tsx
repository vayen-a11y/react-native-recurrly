import "@/global.css"
import {FlatList, Image, Pressable, Text, View} from "react-native";
import {useUser} from "@clerk/expo";
import {posthog} from "@/lib/posthog";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import images from "@/constants/images";
import {HOME_BALANCE, HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import {getDisplayName} from "@/lib/auth";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useState} from "react";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    const {user} = useUser();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const displayName = getDisplayName(user);

    const handleSubscriptionPress = (subscription: Subscription) => {
        const isExpanding = expandedSubscriptionId !== subscription.id;

        if (isExpanding) {
            posthog?.capture('subscription_expanded', {
                subscription_id: subscription.id,
                ...(subscription.category ? { category: subscription.category } : {}),
                ...(subscription.billing ? { billing: subscription.billing } : {}),
            });
        }

        setExpandedSubscriptionId((currentId) =>
            currentId === subscription.id ? null : subscription.id);
    };

    const handleCreateSubscription = (subscription: Subscription) => {
        setSubscriptions((current) => [subscription, ...current]);
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            <View className="home-header">
                                <View className="home-user">
                                    <Image source={images.avatar} className="home-avatar" />
                                    <Text className="home-user-name">{displayName}</Text>
                                </View>

                                <Pressable
                                    onPress={() => setIsCreateModalVisible(true)}
                                    hitSlop={8}
                                >
                                    <Image source={icons.add} className="home-add-icon" />
                                </Pressable>
                            </View>

                            <View className="home-balance-card">
                                <Text className="home-balance-label">Balance</Text>

                                <View className="home-balance-row">
                                    <Text className="home-balance-amount">
                                        {formatCurrency(HOME_BALANCE.amount)}
                                    </Text>
                                    <Text className="home-balance-date">
                                        {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}
                                    </Text>
                                </View>
                            </View>

                            <View className="mt-5">
                                <ListHeading title="Upcoming" />

                                <FlatList
                                    data={UPCOMING_SUBSCRIPTIONS}
                                    renderItem={({item}) => (
                                        <UpcomingSubscriptionCard {... item} />)}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals yet.</Text>}
                                />
                            </View>

                            <ListHeading title="All Subscriptions" />

                        </>
                    ) }
                    data={subscriptions}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <SubscriptionCard
                            {...item}
                            expanded={expandedSubscriptionId === item.id}
                            onPress={() => handleSubscriptionPress(item)}
                            />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent = {() => <View className="h-4" /> }
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
                    contentContainerClassName="pb-30"
                />

                <CreateSubscriptionModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onCreate={handleCreateSubscription}
                />

        </SafeAreaView>
    );
}