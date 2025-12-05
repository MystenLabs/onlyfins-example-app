import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, IconButton } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { ProfileDropdown } from "./components/ProfileDropdown";
import CreateUsernameModal from "./components/createUsernameModal";
import { useUserSubname } from "./hooks/useUserSubname";

function App() {
  const currentAccount = useCurrentAccount();
  const { hasSubname, isLoading: isSubnameLoading } = useUserSubname();
  const [shouldCreateUsername, setShouldCreateUsername] = useState(false);

  // Show username modal if user has no subnames
  useEffect(() => {
    console.log('address', currentAccount?.address)
    if (currentAccount && !isSubnameLoading && !hasSubname) {
      setShouldCreateUsername(true);
    }
  }, [currentAccount, hasSubname, isSubnameLoading])

  return (
    <>
      <CreateUsernameModal isOpen={shouldCreateUsername} onClose={() => setShouldCreateUsername(false)} />
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
              // trackEvent(AnalyticsEvents.GITHUB_CLICKED); // TODO
              window.open('https://github.com/MystenLabs/onlyfins-example-app', '_blank');
            }}
          >
            <GitHubLogoIcon width="24" height="24" />
          </IconButton>
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => {
              // trackEvent(AnalyticsEvents.DISCORD_CLICKED); // TODO
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
            
      </Container>
    </>
  );
}

export default App;
