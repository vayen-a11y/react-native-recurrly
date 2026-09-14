import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import {useState} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import clsx from "clsx";
import dayjs from "dayjs";
import {icons} from "@/constants/icons";
import {colors} from "@/constants/theme";

const FREQUENCIES = ["Monthly", "Yearly"] as const;
const CATEGORIES = [
    "Entertainment",
    "AI Tools",
    "Developer Tools",
    "Design",
    "Productivity",
    "Cloud",
    "Music",
    "Other",
] as const;

type Frequency = (typeof FREQUENCIES)[number];
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
    Entertainment: "#f5c542",
    "AI Tools": "#b8d4e3",
    "Developer Tools": "#e8def8",
    Design: "#b8e8d0",
    Productivity: "#f6eecf",
    Cloud: "#c5dff0",
    Music: "#f3c4b8",
    Other: "#fff8e7",
};

const INITIAL_FREQUENCY: Frequency = "Monthly";
const INITIAL_CATEGORY: Category = "Entertainment";

const CreateSubscriptionModal = ({
    visible,
    onClose,
    onCreate,
}: CreateSubscriptionModalProps) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<Frequency>(INITIAL_FREQUENCY);
    const [category, setCategory] = useState<Category>(INITIAL_CATEGORY);
    const [nameError, setNameError] = useState(false);
    const [priceError, setPriceError] = useState(false);
    const insets = useSafeAreaInsets();

    const parsedPrice = Number.parseFloat(price.replace(",", "."));
    const isNameValid = name.trim().length > 0;
    const isPriceValid = Number.isFinite(parsedPrice) && parsedPrice > 0;
    const canSubmit = isNameValid && isPriceValid;

    const resetForm = () => {
        setName("");
        setPrice("");
        setFrequency(INITIAL_FREQUENCY);
        setCategory(INITIAL_CATEGORY);
        setNameError(false);
        setPriceError(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = () => {
        const trimmedName = name.trim();
        const nextPrice = Number.parseFloat(price.replace(",", "."));
        const nextNameValid = trimmedName.length > 0;
        const nextPriceValid = Number.isFinite(nextPrice) && nextPrice > 0;

        setNameError(!nextNameValid);
        setPriceError(!nextPriceValid);

        if (!nextNameValid || !nextPriceValid) return;

        const startDate = dayjs();
        const renewalDate = startDate.add(1, frequency === "Yearly" ? "year" : "month");

        onCreate({
            id: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
            name: trimmedName,
            price: nextPrice,
            frequency,
            billing: frequency,
            category,
            status: "active",
            startDate: startDate.toISOString(),
            renewalDate: renewalDate.toISOString(),
            icon: icons.wallet,
            color: CATEGORY_COLORS[category],
            currency: "USD",
        });

        resetForm();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View className="modal-overlay">
                    <Pressable className="flex-1" onPress={handleClose} />
                    <View
                        className="modal-container overflow-hidden"
                        style={{paddingBottom: insets.bottom}}
                    >
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={handleClose} hitSlop={8}>
                                <Text className="modal-close-text">×</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="modal-body">
                                <View className="auth-field">
                                    <Text className="auth-label">Name</Text>
                                    <TextInput
                                        className={clsx("auth-input", nameError && "auth-input-error")}
                                        placeholder="Netflix"
                                        placeholderTextColor={colors.mutedForeground}
                                        value={name}
                                        onChangeText={(value) => {
                                            setName(value);
                                            if (nameError) setNameError(value.trim().length === 0);
                                        }}
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                    />
                                    {nameError && (
                                        <Text className="auth-error">Name is required.</Text>
                                    )}
                                </View>

                                <View className="auth-field">
                                    <Text className="auth-label">Price</Text>
                                    <TextInput
                                        className={clsx("auth-input", priceError && "auth-input-error")}
                                        placeholder="9.99"
                                        placeholderTextColor={colors.mutedForeground}
                                        value={price}
                                        onChangeText={(value) => {
                                            setPrice(value);
                                            if (priceError) {
                                                const next = Number.parseFloat(value.replace(",", "."));
                                                setPriceError(!(Number.isFinite(next) && next > 0));
                                            }
                                        }}
                                        keyboardType="decimal-pad"
                                    />
                                    {priceError && (
                                        <Text className="auth-error">Enter a positive price.</Text>
                                    )}
                                </View>

                                <View className="auth-field">
                                    <Text className="auth-label">Frequency</Text>
                                    <View className="picker-row">
                                        {FREQUENCIES.map((option) => {
                                            const isActive = frequency === option;
                                            return (
                                                <Pressable
                                                    key={option}
                                                    className={clsx(
                                                        "picker-option",
                                                        isActive && "picker-option-active"
                                                    )}
                                                    onPress={() => setFrequency(option)}
                                                >
                                                    <Text
                                                        className={clsx(
                                                            "picker-option-text",
                                                            isActive && "picker-option-text-active"
                                                        )}
                                                    >
                                                        {option}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>

                                <View className="auth-field">
                                    <Text className="auth-label">Category</Text>
                                    <View className="category-scroll">
                                        {CATEGORIES.map((option) => {
                                            const isActive = category === option;
                                            return (
                                                <Pressable
                                                    key={option}
                                                    className={clsx(
                                                        "category-chip",
                                                        isActive && "category-chip-active"
                                                    )}
                                                    onPress={() => setCategory(option)}
                                                >
                                                    <Text
                                                        className={clsx(
                                                            "category-chip-text",
                                                            isActive && "category-chip-text-active"
                                                        )}
                                                    >
                                                        {option}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>

                                <Pressable
                                    className={clsx("auth-button", !canSubmit && "auth-button-disabled")}
                                    onPress={handleSubmit}
                                >
                                    <Text className="auth-button-text">Add Subscription</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;
