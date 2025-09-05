export interface Role {
  id: number;
  roleName: string;
}

export interface User {
    university: string;
  id: number;
  firstName: string;
  surname: string;
  registrationStatus?: string;
  roles?: string[]; // Dodaję role z JWT tokenu - zachowuję dla kompatybilności
  roleObjects?: Role[]; // Dodaję obiekty ról jak w kodzie Java ....
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  loginWithUserId: (userId: number) => Promise<boolean>;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  loading: boolean; // Alias dla isLoading dla kompatybilności
  token: string | null;
}
