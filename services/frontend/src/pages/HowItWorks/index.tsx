import { Box, Container, Typography, Grid, Paper, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';

const Section = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 0),
  scrollMarginTop: '64px',
}));

const StepCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
}));

const StepImage = styled('img')({
  width: '100%',
  height: 'auto',
  marginBottom: '24px',
  borderRadius: '12px',
});

const StepTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 700,
}));

const StepContent = styled(Box)(({ theme }) => ({
  '& p': {
    marginBottom: theme.spacing(2),
    lineHeight: 1.6,
  },
  '& ul': {
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(3),
  },
  '& li': {
    marginBottom: theme.spacing(1),
  },
}));

const HowItWorksPage = () => {
  const theme = useTheme();

  const steps = [
    {
      title: "1. Connect Your Web3 Wallet",
      image: "/assets/HOW1.png",
      content: `### Getting Started
Begin by connecting your cryptocurrency wallet to My Odyssey. Click the Connect Wallet button, and choose WalletConnect or another supported Web3 wallet (like MetaMask, Trust Wallet, etc.).

### What This Means
- This wallet will serve as your login and identity on the platform
- No separate accounts needed
- Your wallet remains in your control – connecting doesn't give us access to your private keys

### Important Note
Use a wallet you trust to keep your journey secure.`
    },
    {
      title: "2. Create a New Goal",
      image: "/assets/HOW2.png",
      content: `### Setting Up Your Goal
Now it's time to set up the goal you want to achieve. Here's what you'll need to provide:

### Required Information
1. **Title**
   - Something short and motivating
   - Permanent and cannot be edited later
   - Choose wisely!

2. **Description**
   - Rich text support with Markdown formatting
   - Add bullet points, bold text, links, or images
   - Can be edited later

3. **Deadline**
   - Fixed target date and time
   - Cannot be changed later
   - Choose a realistic timeframe

4. **Blockchain Network**
   - Choose from Ethereum, Polygon, or other supported networks
   - Consider transaction fees and currency type
   - Select a network you're comfortable with

### Important Reminder
Deadlines can't be changed later. 🔒`
    },
    {
      title: "3. Review & Confirm Your Goal",
      image: "/assets/HOW3.png",
      content: `### Final Check
Before your goal goes live, you'll get a chance to review all the details you entered.

### What to Verify
- Goal title spelling and accuracy
- Deadline date correctness
- Description clarity and completeness

### Important Notes
- Title and deadline will be locked once published
- Description can be edited later
- Changes to title/deadline are only possible in rare cases with support team assistance

### Ready to Proceed?
If everything looks good, you're ready for the next step. Take a deep breath – you're about to commit to your goal in a big way!

### Reminder
Make sure everything is right – it's final once you publish.`
    },
    {
      title: "4. Stake Your Deposit & Publish the Goal",
      image: "/assets/HOW4.png",
      content: `### Making It Official
This is where the commitment gets real. To officially start your Odyssey, you'll stake a deposit in crypto as a personal commitment to the goal.

### The Process
1. Enter your desired deposit amount
2. Click Publish
3. Confirm the transaction in your wallet
4. Wait for blockchain confirmation

### What Happens Next
- Your funds are locked in a secure smart contract
- The goal becomes publicly visible
- Your deposit serves as "skin in the game"
- Creates trust with potential supporters

### Security Note
The funds are held transparently on the blockchain; neither My Odyssey nor anyone else can access them prematurely.

### Important Reminder
Don't stake more than you can afford to lose. 💰`
    },
    {
      title: "5. Share Your Goal and Track Progress",
      image: "/assets/HOW5.png",
      content: `### Spreading the Word
With your goal live, it's time to share your journey:

### Sharing Options
- Use your unique goal page link
- Share with friends and family
- Post on social media
- Invite potential supporters

### Tracking Progress
Use My Odyssey's built-in Task Tracker to:
- Break goals into smaller tasks
- Mark completed milestones
- Update your status regularly
- Keep supporters informed

### Benefits of Regular Updates
- Maintains accountability
- Builds trust with donors
- Celebrates small wins
- Keeps motivation high

### Remember
Your journey can inspire others – share updates and celebrate progress.`
    },
    {
      title: "6. Complete Your Goal (or Face the Consequences)",
      image: "/assets/HOW6.png",
      content: `### Success Path
When you reach your goal (on or before deadline):

1. **Mark as Complete**
   - Click Complete Goal button
   - Provide completion evidence if needed
   - Smart contract releases funds

2. **Receive Rewards**
   - Get your deposit back
   - Receive donor contributions
   - Thank your supporters

### Failure Path
If deadline passes without completion:

1. **Consequences**
   - Forfeit your staked deposit
   - Donors can reclaim contributions
   - Funds may be redistributed

2. **Silver Lining**
   - Lost deposit helps fund other goals
   - Supports community growth
   - Learning opportunity

### Moving Forward
- Success: Celebrate achievement and rewards
- Failure: Learn from experience and try again
- Either way: Growth and accountability

### Final Note
Succeed or stumble, you'll learn and grow either way.`
    }
  ];

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default }}>
      <Container maxWidth="lg">
        <Section>
          <Typography variant="h2" component="h1" align="center" gutterBottom sx={{ fontWeight: 700 }}>
            How It Works: Your Journey with My Odyssey
          </Typography>
          
          <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6, maxWidth: '800px', mx: 'auto' }}>
            My Odyssey is a Web3 goal-setting platform that combines personal commitment and community support to help you achieve your goals. The process is simple, secure, and motivating. Here's a step-by-step guide to how it works:
          </Typography>

          {steps.map((step, index) => (
            <Box key={index} sx={{ mb: 8 }}>
              <StepCard>
                <StepTitle variant="h4">
                  {step.title}
                </StepTitle>
                
                <Grid container spacing={4}>
                  {step.image && (
                    <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                      <StepImage src={step.image} alt={step.title} />
                    </Box>
                  )}
                  
                  <Box sx={{ width: { xs: '100%', md: step.image ? '58.33%' : '100%' } }}>
                    <StepContent>
                      <ReactMarkdown>{step.content}</ReactMarkdown>
                    </StepContent>
                  </Box>
                </Grid>
              </StepCard>
            </Box>
          ))}
          
          <Box sx={{ mt: 8, p: 4, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
            <Typography variant="h5" component="h3" align="center" gutterBottom sx={{ fontWeight: 600 }}>
              In summary
            </Typography>
            <Typography variant="body1" align="center" paragraph>
              My Odyssey works as your accountability partner: you define a goal, lock in a commitment fund, gather support, show your progress, and either triumph and claim the rewards, or miss the mark and accept the consequences. Throughout the process, the platform builds trust through transparency – everything is secured by smart contracts on blockchain, so you and your supporters know the rules can't be bent. It's a motivating, trust-driven way to turn your big goals into reality. Ready to start your odyssey? Connect your wallet and set your goal today!
            </Typography>
          </Box>
        </Section>
      </Container>
    </Box>
  );
};

export default HowItWorksPage;
