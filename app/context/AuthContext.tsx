// import React, { createContext, useEffect, useReducer } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// interface AuthState {
//   user: any;
//   token: any;
//   loading: boolean;
//   error: string | null;
//   dispatch?: React.Dispatch<AuthAction>;
// }

// const INITIAL_STATE: AuthState = {
//   user: null,
//   token: null,
//   loading: false,
//   error: null,
// };

// type AuthAction =
//   | { type: "LOGIN_START" }
//   | { type: "LOGIN_SUCCESS"; payload: { user: any; token: any } }
//   | { type: "LOGIN_FAILURE"; payload: string }
//   | { type: "LOGOUT" };

// export const AuthContext = createContext<AuthState>(INITIAL_STATE);

// const AuthReducer = (state: AuthState, action: AuthAction) => {
//   switch (action.type) {
//     case "LOGIN_START":
//       return {
//         user: null,
//         token: null,
//         loading: true,
//         error: null,
//       };
//     case "LOGIN_SUCCESS":
//       return {
//         user: action.payload.user,
//         token: action.payload.token,
//         loading: false,
//         error: null,
//       };
//     case "LOGIN_FAILURE":
//       return {
//         user: null,
//         token: null,
//         loading: false,
//         error: action.payload,
//       };
//     case "LOGOUT":
//       return {
//         user: null,
//         token: null,
//         loading: false,
//         error: null,
//       };
//     default:
//       return state;
//   }
// };

// export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         const storedUser = await AsyncStorage.getItem("user");
//         const storedToken = await AsyncStorage.getItem("token");

//         if (storedUser && storedToken) {
//           dispatch({
//             type: "LOGIN_SUCCESS",
//             payload: { user: JSON.parse(storedUser), token: storedToken },
//           });
//         }
//       } catch (error) {
//         console.error("Error initializing auth:", error);
//       }
//     };
//     initializeAuth();
//   }, []);

//   useEffect(() => {
//     const saveData = async () => {
//       if (state.user && state.token) {
//         await AsyncStorage.setItem("user", JSON.stringify(state.user));
//         await AsyncStorage.setItem("token", state.token);
//       } else {
//         console.log("Clearing storage.");
//         await AsyncStorage.removeItem("user");
//         await AsyncStorage.removeItem("token");
//       }
//     };
//     saveData();
//   }, [state.user, state.token]);

//   return (
//     <AuthContext.Provider
//       value={{
//         user: state.user,
//         token: state.token,
//         loading: state.loading,
//         error: state.error,
//         dispatch,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// import React, { createContext, useReducer, useEffect } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// // import SplashScreen from "@/app/loading/loading"; // Import màn hình Splash
// import LoadingScreen from "../loading/loading";
// // Định nghĩa state và action
// interface AuthState {
//   user: any | null;
//   token: string | null;
//   loading: boolean;
//   error: string | null;
//   dispatch: any | null,
// }

// type AuthAction =
//   | { type: "LOGIN_START" }
//   | { type: "LOGIN_SUCCESS"; payload: { user: any; token: string } }
//   | { type: "LOGIN_FAILURE"; payload: string }
//   | { type: "LOGOUT" };

// // Trạng thái ban đầu
// const INITIAL_STATE: AuthState = {
//   user: null,
//   token: null,
//   loading: true,
//   error: null,
//   dispatch: null, // add this line
// };
// // Reducer để xử lý các action
// const AuthReducer = (state: AuthState, action: AuthAction): AuthState => {
//   switch (action.type) {
//     case "LOGIN_START":
//       return { ...state, loading: true, error: null };
//     case "LOGIN_SUCCESS":
//       return {
//         ...state,
//         user: action.payload.user,
//         token: action.payload.token,
//         loading: false, // Ngừng loading sau khi đăng nhập thành công
//         error: null,
//       };
//     case "LOGIN_FAILURE":
//       return { ...state, user: null, token: null, loading: false, error: action.payload };
//     case "LOGOUT":
//       return { ...state, user: null, token: null, loading: false }; // Đặt loading là false sau khi logout
//     default:
//       return state;
//   }
// };

// // Context
// export const AuthContext = createContext<{
//   user: any | null;
//   token: string | null;
//   loading: boolean;
//   error: string | null;
//   dispatch: React.Dispatch<AuthAction> | null;
// }>(INITIAL_STATE);

// // Provider
// export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

//   // Initialize auth data
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         dispatch({ type: "LOGIN_START" }); // Bắt đầu quá trình loading

//         const storedUser = await AsyncStorage.getItem("user");
//         const storedToken = await AsyncStorage.getItem("token");

//         if (storedUser && storedToken) {
//           dispatch({
//             type: "LOGIN_SUCCESS",
//             payload: { user: JSON.parse(storedUser), token: storedToken },
//           });
//         } else {
//           dispatch({ type: "LOGOUT" });
//         }
//       } catch (error) {
//         console.error("Error initializing auth:", error);
//         dispatch({ type: "LOGOUT" }); // Xử lý lỗi bằng cách logout
//       }
//     };

//     initializeAuth();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ ...state, dispatch }}>
//       {/* Hiển thị SplashScreen khi đang loading */}
//       {state.loading ? <LoadingScreen /> : children}
//     </AuthContext.Provider>
//   );
// };

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
      return { user: null, token: null, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return { user: action.payload.user, token: action.payload.token, loading: false, error: null };
    case "LOGIN_FAILURE":
      return { user: null, token: null, loading: false, error: action.payload };
    case "LOGOUT":
      return { user: null, token: null, loading: false, error: null };
    default:
      return state;
  }
};

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    const saveData = async () => {
      if (state.user && state.token) {
        await AsyncStorage.setItem("user", JSON.stringify(state.user));
        await AsyncStorage.setItem("token", state.token);
      } else {
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("token");
      }
    };
    saveData();
  }, [state.user, state.token]);

  return (
    <AuthContext.Provider value={{ user: state.user, token: state.token, loading: state.loading, error: state.error, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
