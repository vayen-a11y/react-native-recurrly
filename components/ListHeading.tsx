import {View, Text, TouchableOpacity} from 'react-native'


const ListHeading = ({title}: ListHeadingProps) => {
    return (
        <View className="List-Head">
            <Text className="list-title">{title}</Text>

            <TouchableOpacity className="list-action">
                <Text className="list-action-text">View all</Text>
            </TouchableOpacity>
        </View>
    )
}
export default ListHeading

