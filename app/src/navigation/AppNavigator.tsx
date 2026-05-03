import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { SignUpScreen } from '../screens/Auth/SignUpScreen';
import { AddTopicScreen } from '../screens/Topics/AddTopicScreen';
import { TopicDetailScreen } from '../screens/Topics/TopicDetailScreen';
import { VocabScreen } from '../screens/Vocab/VocabScreen';
import { supabase } from '../store/useAuthStore';
import { Colors } from '../theme/colors';
import { Session } from '@supabase/supabase-js';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

export function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  const signedInAtRef = useRef<number>(0);

  useEffect(() => {
    // Get session from AsyncStorage on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('INITIAL SESSION:', session?.user?.email ?? 'none');
      sessionRef.current = session;
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AUTH EVENT:', event, session?.user?.email ?? 'none');

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          signedInAtRef.current = Date.now();
          sessionRef.current = session;
          setSession(session);
          setIsLoading(false);
        }
      } else if (event === 'INITIAL_SESSION') {
        // Only update if we get a real session here
        if (session) {
          sessionRef.current = session;
          setSession(session);
        }
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        const ms = Date.now() - signedInAtRef.current;
        // Supabase fires spurious SIGNED_OUT events on mobile during auth
        // Ignore any SIGNED_OUT within 10 seconds of a SIGNED_IN if we have a session
        if (ms < 10000 && sessionRef.current) {
          console.log('Ignoring spurious SIGNED_OUT after', ms, 'ms');
          // Re-verify we still have a valid session
          supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (currentSession) {
              console.log('Session still valid after SIGNED_OUT event, keeping user logged in');
              sessionRef.current = currentSession;
              setSession(currentSession);
            } else {
              console.log('Session truly gone, logging out');
              sessionRef.current = null;
              setSession(null);
            }
          });
        } else {
          console.log('Real SIGNED_OUT after', ms, 'ms');
          sessionRef.current = null;
          setSession(null);
          setIsLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen
              name="AddTopic"
              component={AddTopicScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
            <Stack.Screen name="Vocab" component={VocabScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}