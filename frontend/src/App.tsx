import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, IconButton } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { ProfileDropdown } from "./components/ProfileDropdown";
import CreateUsernameModal from "./components/createUsernameModal";
import { useUserSubname } from "./hooks/useUserSubname";
import { Feed } from "./components/Feed";
import { SessionExpirationModal } from "./components/SessionExpirationModal";
import { useSessionKey } from "./providers/SessionKeyProvider";
import { trackEvent, AnalyticsEvents } from "./utils/analytics";

function App() {
  const currentAccount = useCurrentAccount();
  const { hasSubname, isLoading: isSubnameLoading } = useUserSubname();
  const [shouldCreateUsername, setShouldCreateUsername] = useState(false);
  const [shouldShowSessionModal, setShouldShowSessionModal] = useState(false);
  const { sessionKey, isInitializing } = useSessionKey();
  const [prevAccount, setPrevAccount] = useState(currentAccount);

  // Track wallet connection changes
  useEffect(() => {
    if (currentAccount && !prevAccount) {
      trackEvent(AnalyticsEvents.WALLET_CONNECTED, {
        address: currentAccount.address,
      });
    } else if (!currentAccount && prevAccount) {
      trackEvent(AnalyticsEvents.WALLET_DISCONNECTED);
    }
    setPrevAccount(currentAccount);
  }, [currentAccount, prevAccount]);

  // Show username modal if user has no subnames
  useEffect(() => {
    console.log('address', currentAccount?.address)
    if (currentAccount && !isSubnameLoading && !hasSubname) {
      setShouldCreateUsername(true);
    }
  }, [currentAccount, hasSubname, isSubnameLoading])

  // Show session modal if user has subname but no session or expired session
  useEffect(() => {
    if (currentAccount && !isSubnameLoading && hasSubname && !isInitializing) {
      const needsSession = !sessionKey || sessionKey.isExpired();
      setShouldShowSessionModal(needsSession);
    } else {
      setShouldShowSessionModal(false);
    }
  }, [currentAccount, hasSubname, isSubnameLoading, sessionKey, isInitializing])

  return (
    <>
      <CreateUsernameModal isOpen={shouldCreateUsername} onClose={() => setShouldCreateUsername(false)} />
      <SessionExpirationModal isOpen={shouldShowSessionModal} />
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Flex align="center" gap="2">
          <Heading>OnlyFins</Heading>
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => {
              trackEvent(AnalyticsEvents.GITHUB_CLICKED);
              window.open('https://github.com/MystenLabs/onlyfins-example-app', '_blank');
            }}
          >
            <GitHubLogoIcon width="24" height="24" />
          </IconButton>
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => {
              trackEvent(AnalyticsEvents.DISCORD_CLICKED);
              window.open('https://discord.gg/sS893zcPMN', '_blank');
            }}
          >
            <DiscordLogoIcon width="24" height="24" />
          </IconButton>
        </Flex>

        <Box>
          <ProfileDropdown />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <Feed />
        </Container>
      </Container>
    </>
  );
}

export default App;
