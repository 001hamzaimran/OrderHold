import {
  Page,
  Box,
  Text,
  Image,
  Button,
  Stack,
  Modal,
  VideoThumbnail,
} from "@shopify/polaris";
import { PlayMajor } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import setupImage from "../assets/index.svg";
import { useState } from "react";

export default function index() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [modalActive, setModalActive] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);

  const handleGetStarted = () => {
    setModalActive(true);
  };

  const handleModalPrimaryAction = () => {
    setModalActive(false);
    navigate("/Settings");
  };

  const handleModalClose = () => {
    setModalActive(false);
    setPlayVideo(false);
  };

  return (
    <Page>
      <TitleBar title="Welcome to OrderHold" />

      <Box
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          width: "100%",
          padding: "2rem",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        <Box
          style={{
            textAlign: "center",
            backgroundColor: "white",
            padding: "3rem 2rem",
            borderRadius: "1.5rem",
            boxShadow: `
              0 4px 6px -1px rgba(0, 0, 0, 0.05),
              0 10px 15px -3px rgba(0, 0, 0, 0.08),
              0 25px 50px -12px rgba(0, 0, 0, 0.15)
            `,
            maxWidth: "720px",
            width: "100%",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative bar */}
          <Box
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            }}
          />

          <Stack vertical spacing="extraLoose" alignment="center">
            <Box
              style={{
                margin: "0 auto",
                padding: "1rem",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              }}
            >
              <Image
                source={setupImage}
                alt="OrderHold"
                width="280px"
                style={{
                  filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))",
                }}
              />
            </Box>

            <Box style={{ maxWidth: "560px" }}>
              <Text
                variant="heading4xl"
                as="h1"
                alignment="center"
                fontWeight="bold"
                style={{
                  background: "linear-gradient(135deg, #2d3748 0%, #4a5568 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "1.5rem",
                  lineHeight: "1.2",
                }}
              >
                Welcome to OrderHold
              </Text>

              <Stack vertical spacing="tight">
                <Text
                  as="p"
                  tone="subdued"
                  alignment="center"
                  style={{
                    fontSize: "1.125rem",
                    lineHeight: "1.6",
                    color: "#64748b",
                  }}
                >
                  Thank you for installing <strong style={{ color: "#334155" }}>OrderHold</strong>
                  . the app that allows you to set a customizable time window in which your customers can
                  edit their order after purchase.
                </Text>

                <Text
                  as="p"
                  tone="subdued"
                  alignment="center"
                  style={{
                    fontSize: "1.125rem",
                    lineHeight: "1.6",
                    color: "#64748b",
                  }}
                >
                  When a customer places an order, they automatically receive an
                  <strong style={{ color: "#334155" }}> order-edit link via email</strong>.
                  Clicking it redirects them to a secure order editing page where they can modify items,
                  quantities, or details all within the time limit you set.
                </Text>
              </Stack>
            </Box>

            <Box style={{ paddingTop: "1rem" }}>
              <Button
                size="large"
                icon={PlayMajor}
                primary
                onClick={handleGetStarted}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "0.75rem",
                  padding: "0.875rem 2rem",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                  transition: "all 0.2s ease-in-out",
                  minWidth: "200px",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                }}
              >
                Get Started
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Modal */}
      <Modal
        open={modalActive}
        onClose={handleModalClose}
        title="OrderHold Quick Overview"
        primaryAction={{
          content: "Configure Hold Timer",
          onAction: handleModalPrimaryAction,
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: handleModalClose,
          },
        ]}
        large
      >
        <Modal.Section>
          <Box
            style={{
              borderRadius: "0.75rem",
              overflow: "hidden",
            }}
          >
            {playVideo ? (
              <div
                style={{
                  position: "relative",
                  paddingTop: "56.25%",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                }}
              >
                <iframe
                  src="https://www.youtube.com/embed/XUgJ61JAesA?autoplay=1"
                  title="OrderHold Quick Start Guide"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: 0,
                    borderRadius: "0.75rem",
                  }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            ) : (
              <VideoThumbnail
                videoLength={80}
                thumbnailUrl="https://img.youtube.com/vi/XUgJ61JAesA/hqdefault.jpg"
                onClick={() => setPlayVideo(true)}
                style={{ borderRadius: "0.75rem" }}
              />
            )}
          </Box>

          <Box padding="400" paddingInlineStart="0" paddingInlineEnd="0">
            <Stack vertical spacing="tight">
              <Text variant="headingMd" as="h3" fontWeight="semibold">
                What OrderHold helps you achieve:
              </Text>

              <Stack vertical spacing="tight">
                <Text as="p" tone="subdued">• Set a flexible timer during which customers may edit their order</Text>
                <Text as="p" tone="subdued">• Automatically send an order-edit link by email</Text>
                <Text as="p" tone="subdued">• Allow customers to modify order items before fulfillment begins</Text>
                <Text as="p" tone="subdued">• Reduce support requests and improve post-purchase experience</Text>
                <Text as="p" tone="subdued">• Enhance customer satisfaction by offering seamless self-service editing</Text>
              </Stack>
            </Stack>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
