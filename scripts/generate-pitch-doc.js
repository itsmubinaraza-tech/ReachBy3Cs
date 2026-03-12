const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

// Helper function to create a styled heading
function createHeading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 400, after: 200 },
  });
}

// Helper function to create a bullet point
function createBullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun(text)],
    bullet: { level },
    spacing: { before: 100, after: 100 },
  });
}

// Helper function to create normal paragraph
function createParagraph(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...options })],
    spacing: { before: 100, after: 100 },
  });
}

// Helper function to create bold paragraph
function createBoldParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true })],
    spacing: { before: 200, after: 100 },
  });
}

// Create the document
const doc = new Document({
  creator: 'ReachBy3Cs',
  title: 'ReachBy3Cs - Investor Pitch Deck',
  description: '5-Minute Investor/Stakeholder Presentation',
  sections: [
    {
      properties: {},
      children: [
        // Title Page
        new Paragraph({
          children: [
            new TextRun({
              text: 'ReachBy3Cs',
              bold: true,
              size: 72,
              color: '0891B2', // Cyan color
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 2000, after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Communicate. Connect. Community.',
              italics: true,
              size: 32,
              color: '6B7280',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '5-Minute Investor/Stakeholder Presentation',
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 2000 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'AI-Powered Engagement Platform',
              size: 24,
              color: '6B7280',
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new PageBreak()],
        }),

        // Slide 1: The Pain Point
        createHeading('Slide 1: The Pain Point', HeadingLevel.HEADING_1),
        new Paragraph({
          children: [
            new TextRun({
              text: '"Your Customers Are Asking for Help Right Now. Are You There?"',
              bold: true,
              italics: true,
              size: 28,
              color: '0891B2',
            }),
          ],
          spacing: { before: 200, after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Timing: 60 seconds', italics: true, color: '9CA3AF' })],
          spacing: { after: 300 },
        }),

        createHeading('Problem Statement', HeadingLevel.HEADING_2),
        createParagraph('Every day, thousands of high-intent conversations happen online:'),
        createBullet('"My partner and I keep fighting about the same things..."'),
        createBullet('"Looking for an app that helps with emotional awareness..."'),
        createBullet('"Anyone know a good couples communication tool?"'),

        createHeading('The Challenge', HeadingLevel.HEADING_2),
        createBoldParagraph('1. Discovery is impossible at scale'),
        createBullet('Relevant conversations are scattered across Reddit, Quora, Twitter, HackerNews, and forums'),
        createBoldParagraph('2. Manual monitoring doesn\'t scale'),
        createBullet('A human can realistically monitor 50-100 posts/day; there are 10,000+ relevant conversations happening'),
        createBoldParagraph('3. Generic responses get ignored'),
        createBullet('Copy-paste marketing responses are spotted instantly and downvoted'),
        createBoldParagraph('4. Risk of brand damage'),
        createBullet('One overly promotional response can get your brand banned from entire communities'),

        createHeading('Market Reality', HeadingLevel.HEADING_2),
        createBullet('78% of consumers trust peer recommendations over ads'),
        createBullet('Reddit alone has 52M daily active users seeking advice'),
        createBullet('Companies spend $10K+/month on community managers who can only cover a fraction of conversations'),

        new Paragraph({ children: [new PageBreak()] }),

        // Slide 2: The Solution
        createHeading('Slide 2: The Solution - ReachBy3Cs', HeadingLevel.HEADING_1),
        new Paragraph({
          children: [
            new TextRun({
              text: '"Communicate. Connect. Community."',
              bold: true,
              italics: true,
              size: 28,
              color: '0891B2',
            }),
          ],
          spacing: { before: 200, after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Timing: 90 seconds', italics: true, color: '9CA3AF' })],
          spacing: { after: 300 },
        }),

        createHeading('What ReachBy3Cs Does', HeadingLevel.HEADING_2),
        createParagraph('An AI-powered engagement platform that finds, analyzes, and drafts authentic responses to high-intent conversations at scale.'),

        createHeading('The 3Cs Framework', HeadingLevel.HEADING_2),

        // 3Cs Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Pillar', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'What It Does', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'How It Works', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Communicate', bold: true })] })] }),
                new TableCell({ children: [new Paragraph('AI detects high-intent conversations')] }),
                new TableCell({ children: [new Paragraph('Signal detection + risk scoring prevents brand damage')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Connect', bold: true })] })] }),
                new TableCell({ children: [new Paragraph('Generates authentic, helpful responses')] }),
                new TableCell({ children: [new Paragraph('3 response variants with smart CTA controls (0-3 levels)')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Community', bold: true })] })] }),
                new TableCell({ children: [new Paragraph('Clusters recurring issues')] }),
                new TableCell({ children: [new Paragraph('Identifies trending pain points for product insights')] }),
              ],
            }),
          ],
        }),

        createHeading('Phase 1 Workflow (Human-in-the-Loop)', HeadingLevel.HEADING_2),
        createParagraph('SerpAPI finds posts → AI analyzes intent → AI generates response → Human reviews → Human posts manually'),

        createHeading('Key Differentiators', HeadingLevel.HEADING_2),
        createBullet('Risk-aware - Each response gets a risk score (low/medium/high/blocked)'),
        createBullet('Confidence-to-Send (CTS) score - 0-1 score determines auto-post eligibility'),
        createBullet('Multi-tenant - One platform serves multiple brands/products'),
        createBullet('Full audit trail - Every action logged for compliance'),

        new Paragraph({ children: [new PageBreak()] }),

        // Slide 3: Architecture
        createHeading('Slide 3: High-Level Architecture', HeadingLevel.HEADING_1),
        new Paragraph({
          children: [
            new TextRun({
              text: '"Built for Scale, Designed for Safety"',
              bold: true,
              italics: true,
              size: 28,
              color: '0891B2',
            }),
          ],
          spacing: { before: 200, after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Timing: 90 seconds', italics: true, color: '9CA3AF' })],
          spacing: { after: 300 },
        }),

        createHeading('Tech Stack', HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Component', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Technology', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Purpose', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Search')] }),
                new TableCell({ children: [new Paragraph('SerpAPI (Google CSE)')] }),
                new TableCell({ children: [new Paragraph('Find posts on Reddit, Quora, X, HN')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('AI Agent')] }),
                new TableCell({ children: [new Paragraph('Python FastAPI + LangGraph')] }),
                new TableCell({ children: [new Paragraph('Process posts through AI skills')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Database')] }),
                new TableCell({ children: [new Paragraph('Supabase (PostgreSQL)')] }),
                new TableCell({ children: [new Paragraph('Store posts, signals, responses, queue')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Web App')] }),
                new TableCell({ children: [new Paragraph('Vercel (Next.js)')] }),
                new TableCell({ children: [new Paragraph('Dashboard, queue, analytics')] }),
              ],
            }),
          ],
        }),

        createHeading('AI Pipeline (5 Skills)', HeadingLevel.HEADING_2),
        createBullet('Signal Detection - Identifies pain points, keywords, emotional intensity'),
        createBullet('Risk Scoring - low/medium/high/blocked classification'),
        createBullet('Response Generation - 3 variants (value-first, soft-CTA, contextual)'),
        createBullet('CTA Classifier - Level 0 (none) to 3 (direct promotion)'),
        createBullet('CTS Decision - Confidence score for auto-posting (Phase 2)'),

        createHeading('Deployment Status', HeadingLevel.HEADING_2),
        createBullet('Web App: Vercel (reachby3cs.com) - LIVE'),
        createBullet('Database: Supabase with Row-Level Security - LIVE'),
        createBullet('Agent Service: Render (Python FastAPI) - LIVE'),
        createBullet('First Tenant: WeAttuned (emotional intelligence app for couples)'),

        new Paragraph({ children: [new PageBreak()] }),

        // Slide 4: Revenue
        createHeading('Slide 4: Revenue & Business Model', HeadingLevel.HEADING_1),
        new Paragraph({
          children: [
            new TextRun({
              text: '"SaaS Pricing Based on AI Processing Volume"',
              bold: true,
              italics: true,
              size: 28,
              color: '0891B2',
            }),
          ],
          spacing: { before: 200, after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Timing: 60 seconds', italics: true, color: '9CA3AF' })],
          spacing: { after: 300 },
        }),

        createHeading('3-Tier Pricing Model', HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Plan', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Price', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Responses/mo', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Detections/mo', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Target Customer', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Starter', bold: true })] })] }),
                new TableCell({ children: [new Paragraph('$49')] }),
                new TableCell({ children: [new Paragraph('500')] }),
                new TableCell({ children: [new Paragraph('1,000')] }),
                new TableCell({ children: [new Paragraph('Solo founders, small startups')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Professional', bold: true })] })] }),
                new TableCell({ children: [new Paragraph('$149')] }),
                new TableCell({ children: [new Paragraph('2,500')] }),
                new TableCell({ children: [new Paragraph('10,000')] }),
                new TableCell({ children: [new Paragraph('Growing SaaS, marketing teams')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Enterprise', bold: true })] })] }),
                new TableCell({ children: [new Paragraph('$399')] }),
                new TableCell({ children: [new Paragraph('10,000')] }),
                new TableCell({ children: [new Paragraph('50,000')] }),
                new TableCell({ children: [new Paragraph('Large brands, agencies')] }),
              ],
            }),
          ],
        }),

        createParagraph('Overage Rates: $0.05/response, $0.01/detection'),

        createHeading('Unit Economics', HeadingLevel.HEADING_2),
        createBullet('SerpAPI cost: ~$0.005/search'),
        createBullet('OpenAI GPT-4 cost: ~$0.02/response'),
        createBullet('Gross margin at scale: 70-80%'),

        createHeading('Revenue Projections', HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Year', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Customers', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'MRR', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'ARR', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Y1')] }),
                new TableCell({ children: [new Paragraph('50')] }),
                new TableCell({ children: [new Paragraph('$7,500')] }),
                new TableCell({ children: [new Paragraph('$90K')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Y2')] }),
                new TableCell({ children: [new Paragraph('250')] }),
                new TableCell({ children: [new Paragraph('$37,500')] }),
                new TableCell({ children: [new Paragraph('$450K')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Y3')] }),
                new TableCell({ children: [new Paragraph('1,000')] }),
                new TableCell({ children: [new Paragraph('$150,000')] }),
                new TableCell({ children: [new Paragraph('$1.8M')] }),
              ],
            }),
          ],
        }),

        createHeading('Go-to-Market Strategy', HeadingLevel.HEADING_2),
        createBullet('Launch: WeAttuned as first tenant (proof of concept)'),
        createBullet('Expand: B2B SaaS companies with community presence'),
        createBullet('Scale: Agencies managing multiple brand communities'),

        new Paragraph({ children: [new PageBreak()] }),

        // Closing Statement
        createHeading('Closing Statement', HeadingLevel.HEADING_1),
        new Paragraph({
          children: [
            new TextRun({
              text: '"ReachBy3Cs turns the chaos of online conversations into organized community engagement. We find the needles in the haystack, help you respond authentically, and prevent brand damage - all while building a database of customer insights."',
              italics: true,
              size: 26,
            }),
          ],
          spacing: { before: 400, after: 600 },
          alignment: AlignmentType.CENTER,
        }),

        createHeading('Call to Action', HeadingLevel.HEADING_2),
        createBullet('Live demo at reachby3cs.com'),
        createBullet('First 3 customers get 50% off for 6 months'),

        new Paragraph({ children: [new PageBreak()] }),

        // Appendix
        createHeading('Appendix: Key Metrics to Track', HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Target', bold: true })] })],
                  shading: { fill: '0891B2', type: ShadingType.SOLID, color: '0891B2' },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Detection Accuracy')] }),
                new TableCell({ children: [new Paragraph('% of posts correctly identified as high-intent')] }),
                new TableCell({ children: [new Paragraph('>85%')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Response Approval Rate')] }),
                new TableCell({ children: [new Paragraph('% of AI responses approved by human')] }),
                new TableCell({ children: [new Paragraph('>70%')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Time Saved')] }),
                new TableCell({ children: [new Paragraph('Hours saved vs. manual monitoring')] }),
                new TableCell({ children: [new Paragraph('10x')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Engagement Rate')] }),
                new TableCell({ children: [new Paragraph('% of posted responses that get replies')] }),
                new TableCell({ children: [new Paragraph('>15%')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Customer LTV')] }),
                new TableCell({ children: [new Paragraph('Average lifetime value')] }),
                new TableCell({ children: [new Paragraph('>$1,500')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Churn Rate')] }),
                new TableCell({ children: [new Paragraph('Monthly customer churn')] }),
                new TableCell({ children: [new Paragraph('<5%')] }),
              ],
            }),
          ],
        }),

        createHeading('Presentation Timing Notes', HeadingLevel.HEADING_2),
        createBullet('Slide 1 (Pain Point): 60 seconds'),
        createBullet('Slide 2 (Solution): 90 seconds'),
        createBullet('Slide 3 (Architecture): 90 seconds'),
        createBullet('Slide 4 (Revenue): 60 seconds'),
        createBullet('Closing: 15 seconds'),
        createBoldParagraph('Total: ~5 minutes'),

        // Contact Info
        new Paragraph({
          children: [
            new TextRun({
              text: '\n\nreachby3cs.com',
              bold: true,
              size: 28,
              color: '0891B2',
            }),
          ],
          spacing: { before: 800 },
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

// Generate and save the document
async function generateDocument() {
  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'docs', 'ReachBy3Cs-Investor-Pitch-Deck.docx');

  // Ensure docs directory exists
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`Document generated: ${outputPath}`);
}

generateDocument().catch(console.error);
