import {FlatList, Text, TextInput, View} from 'react-native'
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useMemo, useState} from "react";
import SubscriptionCard from "@/components/SubscriptionCard";
import {HOME_SUBSCRIPTIONS} from "@/constants/data";
import {colors} from "@/constants/theme";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredSubscriptions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return HOME_SUBSCRIPTIONS;

        return HOME_SUBSCRIPTIONS.filter((subscription) =>
            [subscription.name, subscription.category, subscription.plan]
                .some((value) => value?.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="subs-title">Subscriptions</Text>

            <TextInput
                className="subs-search"
                placeholder="Search subscriptions..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
            />

            <FlatList
                data={filteredSubscriptions}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedId === item.id}
                        onPress={() => setExpandedId((currentId) =>
                            currentId === item.id ? null : item.id
                        )}
                    />
                )}
                extraData={expandedId}
                ItemSeparatorComponent={() => <View className="h-4" />}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListEmptyComponent={
                    <Text className="home-empty-state">
                        {searchQuery.trim()
                            ? "No subscriptions match your search."
                            : "No subscriptions yet."}
                    </Text>
                }
                contentContainerClassName="pt-5 pb-30"
            />
        </SafeAreaView>
    )
}

export default Subscriptions
