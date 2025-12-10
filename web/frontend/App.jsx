import { BrowserRouter, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { setStoreDetail } from "./redux/Slices/StoreSlice";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const getStore = async () => {
    try {
      const response = await fetch('/api/store/get-shop');
      const data = await response.json();
      console.log("Store data", data);
      dispatch(setStoreDetail(data));
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  }

  useEffect(() => {
    getStore();
  }, []);

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <NavMenu>
            <Link to="/" rel="home" />
            <Link to='/Settings'>Settings</Link>
          </NavMenu>
          <Routes pages={pages} />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
