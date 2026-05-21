import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TextInputProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface InputProps extends TextInputProps {
  /**
   * Label title text displayed above the input.
   */
  label?: string;
  /**
   * Active validation error message.
   */
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error 
              ? colors.danger 
              : isFocused 
                ? colors.primary 
                : colors.border,
            shadowColor: isFocused ? colors.primary : 'transparent',
            shadowOpacity: isFocused ? 0.1 : 0,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.gray400}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.textInput,
            { color: colors.textPrimary },
            style as any,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Nunito',
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Nunito',
    height: '100%',
    width: '100%',
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'Nunito',
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
