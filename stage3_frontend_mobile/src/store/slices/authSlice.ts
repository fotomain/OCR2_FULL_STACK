import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  provider?: string;
}

interface AuthState {
  currentUser: UserProfile;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  allUsers: UserProfile[];
}

const DEFAULT_USER: UserProfile = {
  id: 'usr-default-01',
  email: 'corporate.lead@vita-genomics.org',
  name: 'Dr. Elena Rostova',
  role: 'Principal Investigator',
  provider: 'supabase'
};

const initialState: AuthState = {
  currentUser: DEFAULT_USER,
  session: null,
  isAuthenticated: true,
  isLoading: false,
  authError: null,
  allUsers: [
    DEFAULT_USER,
    {
      id: 'usr-default-02',
      email: 'alex.morgan@baltic-eye.eu',
      name: 'Alex Morgan',
      role: 'Ophthalmic Surgery Director',
      provider: 'supabase'
    },
    {
      id: 'usr-default-03',
      email: 'michael.chen@nexus-biomed.org',
      name: 'Dr. Michael Chen',
      role: 'Google Corporate Officer',
      provider: 'google'
    }
  ]
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.authError = action.payload;
      state.isLoading = false;
    },
    authSuccess: (state, action: PayloadAction<{ user: UserProfile; session?: any }>) => {
      state.currentUser = action.payload.user;
      state.session = action.payload.session || null;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.authError = null;

      // Add to list of known users if not present
      if (!state.allUsers.find((u) => u.email === action.payload.user.email)) {
        state.allUsers.push(action.payload.user);
      }
    },
    signOutSuccess: (state) => {
      state.currentUser = {
        id: 'guest-' + Date.now(),
        email: 'guest@ocr2-mobile.local',
        name: 'Guest Analyst',
        role: 'Visitor',
        provider: 'guest'
      };
      state.session = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.authError = null;
    },
    setCurrentUser: (state, action: PayloadAction<UserProfile>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    setAllUsers: (state, action: PayloadAction<UserProfile[]>) => {
      state.allUsers = action.payload;
    }
  }
});

export const {
  setAuthLoading,
  setAuthError,
  authSuccess,
  signOutSuccess,
  setCurrentUser,
  setAllUsers
} = authSlice.actions;

export default authSlice.reducer;
