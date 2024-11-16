// ChatBox.tsx

import React from 'react';
import {
  TextInput,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';

interface ChatBoxProps {
  containerStyle?: string;
  inputStyle?: string;
  placeholderTextColor?: string;
  className?: string;
  value: string;
  onChangeText: (text: string) => void;
  [key: string]: any; // For other TextInput props
}

const ChatBox: React.FC<ChatBoxProps> = React.memo(({
  containerStyle,
  inputStyle,
  placeholderTextColor = '#AAAAAA',
  className,
  value,
  onChangeText,
  ...props
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ width: '100%' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={`my-2 w-full ${containerStyle}`}>
          <View
            className={`bg-neutral-100 rounded-lg border border-neutral-100 focus:border-primary-500 ${className}`}
          >
            <TextInput
              className={`p-4 font-JakartaSemiBold text-[15px] text-left ${inputStyle}`}
              placeholderTextColor={placeholderTextColor}
              multiline={true}
              numberOfLines={10}
              textAlignVertical="top"
              value={value}
              onChangeText={onChangeText}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
});

export default ChatBox;
