import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import RealEstatePage from "./pages/RealEstatePage";
import OffersPage from "./pages/OffersPage";
import AuthPage from "./pages/AuthPage";
import ServiceListingPage from "./pages/ServiceProfilePage";
import CreateOfferPage from "./pages/CreateOfferPage";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/real-estate" element={<RealEstatePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/service-listing" element={<ServiceListingPage />} />
          <Route path="/offers/new" element={<CreateOfferPage />} />
          <Route path="/offers/edit/:offerId" element={<CreateOfferPage />} />
        </Routes>
      </MainLayout>
    </AuthProvider>
  );
};

export default App;
