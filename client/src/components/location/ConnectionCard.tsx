// import React from 'react';
// import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

// interface ConnectionCardProps {
//   connection: {
//     id: string;
//     name: string;
//     avatar: string;
//     coordinates: {
//       latitude: number;
//       longitude: number;
//     };
//   };
//   onPress: () => void;
// }

// export function ConnectionCard({ connection, onPress }: ConnectionCardProps) {
//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress}>
//       <Image source={{ uri: connection.avatar }} style={styles.avatar} />
//       <Text style={styles.name}>{connection.name}</Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: 'white',
//     borderRadius: 15,
//     padding: 10,
//     alignItems: 'center',
//     width: 100,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginBottom: 5,
//   },
//   name: {
//     fontSize: 12,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
// }); 

import { View, Text } from 'react-native'
import React from 'react'

export default function ConnectionCard() {
  return (
    <View>
      <Text>ConnectionCard</Text>
    </View>
  )
}