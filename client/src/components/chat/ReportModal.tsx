import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
}

const reportReasons = [
  'Abuse',
  'Harassment',
  'Inappropriate Content',
  'Spam',
  'Fake Profile',
  'Other',

];

export function ReportModal({ visible, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState(reportReasons[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit(reason, description);
    setReason(reportReasons[0]);
    setDescription('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-2xl font-bold text-neutral-dark mb-4">
            Report User
          </Text>
          
          <View className="bg-neutral-light rounded-xl mb-4">
            <Picker
              selectedValue={reason}
              onValueChange={setReason}
            >
              {reportReasons.map((r) => (
                <Picker.Item key={r} label={r} value={r} />
              ))}
            </Picker>
          </View>
          
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue..."
            multiline
            numberOfLines={4}
            className="bg-neutral-light rounded-xl p-4 mb-6"
            placeholderTextColor="#666"
          />
          
          <View className="flex-row gap-4">
            <TouchableOpacity 
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-neutral-light"
            >
              <Text className="text-center text-neutral-dark font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-primary"
            >
              <Text className="text-center text-white font-semibold">
                Submit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 