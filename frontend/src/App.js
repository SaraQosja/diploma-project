// // frontend/src/App.js 
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Login from './components/auth/Login';
// import Register from './components/auth/Register';
// import Dashboard from './pages/Dashboard';
// import Home from './pages/Home';
// import Profile from './pages/Profile';
// import TakeTest from './components/tests/TakeTest';
// import Recommendations from './pages/Recommendations';
// import Loading from './components/common/Loading';
// import GradeFlow from './components/grades/GradeFlow';
// import ChatWindow from './components/chat/ChatWindow';

// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return <Loading />;
//   }

//   return isAuthenticated ? children : <Navigate to="/login" replace />;
// };

// const PublicRoute = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return <Loading />;
//   }

//   return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
// };

// const AppRoutes = () => {
//   return (
//     <Routes>
//       {/* Public Routes */}
//       <Route path="/" element={<Home />} />
//       <Route 
//         path="/login" 
//         element={
//           <PublicRoute>
//             <Login />
//           </PublicRoute>
//         } 
//       />
//       <Route 
//         path="/register" 
//         element={
//           <PublicRoute>
//             <Register />
//           </PublicRoute>
//         } 
//       />

    
//       <Route 
//         path="/dashboard" 
//         element={
//           <ProtectedRoute>
//             <Dashboard />
//           </ProtectedRoute>
//         } 
//       />

//       <Route 
//         path="/profile" 
//         element={
//           <ProtectedRoute>
//             <Profile />
//           </ProtectedRoute>
//         } 
//       />

//           <Route path="/chat"  
//           element={<ChatWindow />} />

      
   
// <Route path="/tests" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
// <Route path="/tests/:testId" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
// <Route path="/grades" element={<ProtectedRoute><GradeFlow /></ProtectedRoute>} />
      
//       <Route 
//         path="/recommendations" 
//         element={
//           <ProtectedRoute>
//             <Recommendations />
//           </ProtectedRoute>
//         } 
//       />


     

      
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// };


// const App = () => {
//   return (
//     <AuthProvider>
//       <Router>
//         <div className="App">
//           <AppRoutes />
          
//           <Toaster
//             position="top-right"
//             toastOptions={{
//               duration: 4000,
//               style: {
//                 background: '#363636',
//                 color: '#fff',
//                 borderRadius: '8px',
//                 fontSize: '14px',
//                 fontWeight: '500',
//               },
//               success: {
//                 duration: 3000,
//                 iconTheme: {
//                   primary: '#10B981',
//                   secondary: '#fff',
//                 },
//                 style: {
//                   background: '#065f46',
//                   color: '#fff',
//                 },
//               },
//               error: {
//                 duration: 5000,
//                 iconTheme: {
//                   primary: '#EF4444',
//                   secondary: '#fff',
//                 },
//                 style: {
//                   background: '#dc2626',
//                   color: '#fff',
//                 },
//               },
//               loading: {
//                 iconTheme: {
//                   primary: '#3B82F6',
//                   secondary: '#fff',
//                 },
//                 style: {
//                   background: '#1e40af',
//                   color: '#fff',
//                 },
//               },
//             }}
//           />
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// };

// export default App;
// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importet
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Profile from './pages/Profile';
import TakeTest from './components/tests/TakeTest';
import Recommendations from './pages/Recommendations';
import Loading from './components/common/Loading';
import GradeFlow from './components/grades/GradeFlow';
import ChatWindow from './components/chat/ChatWindow';

// ADMIN
import AdminDashboard from './components/admin/AdminDashboard';

// 🔹 ProtectedRoute për përdoruesit normal
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Nëse është admin dhe përpiqet të hapë dashboard normal → ridrejtohet te /admin
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// 🔹 AdminRoute për admin panelin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return user?.role === "admin" ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route 
        path="/login" 
        element={
          <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          <Register />
        } 
      />

      {/* Admin */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />

      {/* Student */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route path="/chat" element={<ProtectedRoute><ChatWindow /></ProtectedRoute>} />
      <Route path="/tests" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
      <Route path="/tests/:testId" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
      <Route path="/grades" element={<ProtectedRoute><GradeFlow /></ProtectedRoute>} />
      <Route 
        path="/recommendations" 
        element={
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        } 
      />

      {/* Default */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
                style: {
                  background: '#065f46',
                  color: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
                style: {
                  background: '#dc2626',
                  color: '#fff',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3B82F6',
                  secondary: '#fff',
                },
                style: {
                  background: '#1e40af',
                  color: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
