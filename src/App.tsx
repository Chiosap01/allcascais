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
import PropertyListingPage from "./pages/PropertyListingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import CookiesPolicy from "./pages/legal/CookiesPolicy";
import Terms from "./pages/legal/Terms";

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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/service-listing" element={<ServiceListingPage />} />
          <Route path="/offers/new" element={<CreateOfferPage />} />
          <Route path="/offers/edit/:offerId" element={<CreateOfferPage />} />
          <Route path="/properties/new" element={<PropertyListingPage />} />
          <Route
            path="/properties/:id/edit"
            element={<PropertyListingPage />}
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiesPolicy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </MainLayout>
    </AuthProvider>
  );
};

export default App;
