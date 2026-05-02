import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { SignUpScreen } from '../screens/Auth/SignUpScreen';
import { AddTopicScreen } from '../screens/Topics/AddTopicScreen';
import { TopicDetailScreen } from '../screens/Topics/TopicDetailScreen';
import { VocabScreen } from '../screens/Vocab/VocabScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

export function AppNavigator() {
  const { session, isLoading, initSession } = useAuthStore();

  useEffect(() => {
    initSession();
  }, []);

  // Register notifications when logged in
  useNotifications();

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          // Auth stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          // App stack
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen
              name="AddTopic"
              component={AddTopicScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="TopicDetail"
              component={TopicDetailScreen}
            />
            <Stack.Screen
              name="Vocab"
              component={VocabScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
