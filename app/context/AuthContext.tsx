import React, { createContext, useEffect, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  user: any;
  token: any;
  loading: boolean;
  error: string | null;
  dispatch?: React.Dispatch<AuthAction>;
}

const INITIAL_STATE: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: any; token: any } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" };

export const AuthContext = createContext<AuthState>(INITIAL_STATE);

const AuthReducer = (state: AuthState, action: AuthAction) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        token: null,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");
  
        if (storedUser && storedToken) {
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: JSON.parse(storedUser), token: storedToken },
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (state.user) {
      AsyncStorage.setItem("user", JSON.stringify(state.user));
      AsyncStorage.setItem("token", state.token || "");
    } else {
      AsyncStorage.removeItem("user");
      AsyncStorage.removeItem("token");
    }
  }, [state.user, state.token]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

