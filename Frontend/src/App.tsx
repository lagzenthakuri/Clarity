import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const { token } = useAuth();
  return token ? <DashboardPage /> : <AuthPage />;
};

export default App;
