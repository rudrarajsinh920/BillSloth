import { differenceInDays, isPast, isToday } from 'date-fns';

export interface LedgerBill {
  id: string;
  vendor: string | null;
  invoice_number: string | null;
  amount: number | null;
  currency: string;
  issue_date?: string | null;
  due_date: string | null;
  category: string;
  status: string;
  computed_status?: string;
  is_verified: number;
  payment_reference?: string | null;
  notes?: string | null;
  original_name?: string | null;
}

export interface AssistantResponse {
  answer: string;
  intent: string;
  matchedCount?: number;
}

// Standard categories in BillSloth with word-boundary aliases
const CATEGORY_MAP: Record<string, string[]> = {
  Utilities: ['utilities', 'utility', 'electric', 'power', 'water', 'gas', 'electricity', 'light', 'energy'],
  'Software/SaaS': ['software', 'saas', 'hosting', 'subscription', 'subscriptions', 'vps', 'infra', 'infrastructure'],
  'Rent/Lease': ['rent', 'lease', 'coworking', 'workspace', 'office space', 'desk'],
  Telecom: ['telecom', 'internet', 'fiber', 'phone', 'cellular', 'mobile', 'broadband', 'cable'],
  Insurance: ['insurance', 'policy', 'liability', 'commercial policy', 'coverage'],
  Supplies: ['supplies', 'stationery', 'office supplies', 'paper', 'ink', 'printer'],
  Taxes: ['tax', 'taxes', 'property tax', 'sales tax'],
  'Professional Services': ['legal', 'accounting', 'consulting', 'professional services', 'cpa', 'attorney'],
};

function formatStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'overdue':
      return 'Overdue';
    case 'due_soon':
      return 'Due Soon';
    case 'needs_review':
      return 'Pending Review';
    case 'paid':
      return 'Settled';
    default:
      return status.replace(/_/g, ' ');
  }
}

function resolveEffectiveStatus(bill: LedgerBill): string {
  if (bill.status === 'paid' || bill.computed_status === 'paid') return 'paid';
  if (bill.is_verified === 0 && (bill.status === 'needs_review' || bill.computed_status === 'needs_review')) {
    return 'needs_review';
  }
  if (!bill.due_date) return bill.status || 'needs_review';

  try {
    const due = new Date(bill.due_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isPast(due) && !isToday(due)) return 'overdue';
    const diff = differenceInDays(due, today);
    if (diff >= 0 && diff <= 7) return 'due_soon';
    return bill.status || 'needs_review';
  } catch {
    return bill.status || 'needs_review';
  }
}

function matchesWord(text: string, word: string): boolean {
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  return regex.test(text);
}

export function answerLedgerQuestion(rawQuery: string, bills: LedgerBill[]): AssistantResponse {
  const query = rawQuery.trim();
  const q = query.toLowerCase();

  // Normalize dynamic status for every bill
  const normalizedBills: LedgerBill[] = bills.map((b) => ({
    ...b,
    computed_status: resolveEffectiveStatus(b),
  }));

  // -------------------------------------------------------------
  // 1. GENERAL HELP / WORKFLOW
  // -------------------------------------------------------------
  if (
    q.includes('how do i use') ||
    q.includes('how to use') ||
    q.includes('how does billsloth work') ||
    q.includes('how does it work') ||
    q.includes('how billsloth works') ||
    q.includes('how to work billsloth') ||
    q.includes('what is billsloth') ||
    q.includes('workflow') ||
    q.includes('getting started') ||
    q === 'help' ||
    q.startsWith('help ') ||
    q.includes('features') ||
    q.includes('overview of billsloth')
  ) {
    return {
      intent: 'help',
      answer: [
        `**How BillSloth Works:**`,
        ``,
        `1. **Import Invoices**: Drag and drop statements (PDF, PNG, JPG) in the **Import Bill** tab. Files stay stored on your local device.`,
        `2. **Review Extracted Details**: Vendor, invoice number, amount, and due date are extracted and marked as **Pending Review**.`,
        `3. **Human Approval Gate**: You review the details side-by-side with your document before approving them into your ledger.`,
        `4. **Track Deadlines**: Monitor upcoming payments on the **Command Center**, **30-Day Cash Radar**, and **Due Date Calendar**.`,
        `5. **Export & Integrate**: Export calendar reminders (.ICS) or download your accounting ledger as CSV anytime.`,
        ``,
        `*Try asking:*`,
        `• "What is my total outstanding balance?"`,
        `• "Which bills are overdue?"`,
        `• "What is due in the next seven days?"`,
        `• "Show me all bills from Metro Grid"`,
        `• "How much do I owe for utilities?"`,
      ].join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 2. EXPLANATION: HUMAN VERIFICATION
  // -------------------------------------------------------------
  if (
    q.includes('verification') ||
    q.includes('unverified') ||
    q.includes('human review') ||
    q.includes('human in the loop') ||
    q.includes('verify bills') ||
    q.includes('approval gate') ||
    q.includes('why verify')
  ) {
    return {
      intent: 'verification_explanation',
      answer: [
        `**How Bill Verification Works:**`,
        ``,
        `1. **Automated Reading**: When you upload an invoice, OCR and parsers extract the vendor, amount, invoice number, and due date.`,
        `2. **Safety Flagging**: Extracted details start in an **Unverified** state so you can inspect them for accuracy.`,
        `3. **Human Sign-Off**: In **Invoices & Bills Ledger**, click **Review & Verify** to compare the extracted fields with the original file and make any adjustments.`,
        `4. **Accurate Books**: BillSloth never initiates automatic bank payments or unauthorized external communications. Verification ensures optical reading errors never corrupt your cash flow planning.`,
      ].join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 3. EMPTY LEDGER CHECK FOR FINANCIAL QUERIES
  // -------------------------------------------------------------
  const isFinancialIntent =
    q.includes('balance') ||
    q.includes('total') ||
    q.includes('owe') ||
    q.includes('overdue') ||
    q.includes('due') ||
    q.includes('upcoming') ||
    q.includes('bill') ||
    q.includes('invoice') ||
    q.includes('spend') ||
    q.includes('cost');

  if (normalizedBills.length === 0 && isFinancialIntent) {
    return {
      intent: 'empty_ledger',
      matchedCount: 0,
      answer: `Your bill ledger is currently empty. No documents have been imported yet. You can import invoices in the **Import Bill** tab or click **Load Sample** to explore with demo data.`,
    };
  }

  // -------------------------------------------------------------
  // 4. DRAFT CORRESPONDENCE / EXTENSION REQUEST
  // -------------------------------------------------------------
  if (
    q.includes('draft') ||
    q.includes('write an email') ||
    q.includes('draft an email') ||
    q.includes('ask for extension') ||
    q.includes('request extension') ||
    q.includes('compose an email')
  ) {
    // Find vendor mentioned in query
    const targetDoc = normalizedBills.find(
      (b) =>
        (b.vendor && q.includes(b.vendor.toLowerCase())) ||
        (b.original_name && q.includes(b.original_name.toLowerCase()))
    ) || normalizedBills.find((b) => b.computed_status === 'overdue') || normalizedBills[0];

    const vendorName = targetDoc?.vendor || 'Vendor Accounts Team';
    const invoiceNum = targetDoc?.invoice_number || 'Statement Reference';
    const amountStr = targetDoc ? `$${(targetDoc.amount || 0).toFixed(2)} ${targetDoc.currency || 'USD'}` : 'outstanding balance';
    const dueDateStr = targetDoc?.due_date || 'the scheduled date';

    return {
      intent: 'draft_email',
      answer: [
        `**Draft Extension Request Email:**`,
        ``,
        `**Subject:** Payment Extension Request — Invoice ${invoiceNum}`,
        ``,
        `Dear ${vendorName} Accounts Team,`,
        ``,
        `I am writing regarding invoice **${invoiceNum}** in the amount of **${amountStr}**, currently due on **${dueDateStr}**.`,
        ``,
        `Due to a temporary scheduling adjustment in our accounting cycle, I would like to respectfully request a brief payment extension of [e.g. 7 business days].`,
        ``,
        `Please let me know if this arrangement is acceptable or if any additional information is required. Thank you for your understanding.`,
        ``,
        `Sincerely,`,
        `[Your Name / Business Name]`,
        targetDoc?.payment_reference ? `Reference: ${targetDoc.payment_reference}` : '',
        ``,
        `*(Note: BillSloth never sends emails automatically. You can review, copy, and send this draft from your email client.)*`,
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 5. SPECIFIC VENDOR LOOKUP (Check BEFORE category aliases)
  // -------------------------------------------------------------
  // Find which known vendor matches the query
  const matchingVendorBills = normalizedBills.filter((b) => {
    if (!b.vendor) return false;
    const vendorLower = b.vendor.toLowerCase();
    // Match entire vendor name or significant sub-words (e.g. "Metro Grid", "CloudScale", "Apex", "Horizon", "OfficeDepot")
    if (q.includes(vendorLower)) return true;
    const significantParts = vendorLower.split(/[\s&/]+/).filter((p) => p.length >= 4 && !['power', 'light', 'systems', 'business', 'offices'].includes(p));
    return significantParts.some((part) => matchesWord(q, part));
  });

  if (matchingVendorBills.length > 0) {
    const primaryVendor = matchingVendorBills[0].vendor || 'Vendor';

    // If query is specifically asking when it is due
    if (q.includes('when') || q.includes('due date') || q.includes('deadline')) {
      if (matchingVendorBills.length === 1) {
        const b = matchingVendorBills[0];
        return {
          intent: 'specific_bill_due_date',
          matchedCount: 1,
          answer: `Your **${b.vendor}** bill (${b.invoice_number ? `Invoice #${b.invoice_number}` : 'No invoice number specified'}) is for **$${(b.amount || 0).toFixed(2)} ${b.currency || 'USD'}** and is due on **${b.due_date || 'No due date specified'}** (Status: **${formatStatus(b.computed_status || b.status)}**).`,
        };
      } else {
        return {
          intent: 'vendor_clarification',
          matchedCount: matchingVendorBills.length,
          answer: [
            `You have **${matchingVendorBills.length} bills** from **${primaryVendor}** in your ledger:`,
            ``,
            ...matchingVendorBills.map(
              (b, idx) =>
                `${idx + 1}. **Invoice ${b.invoice_number || 'N/A'}**: $${(b.amount || 0).toFixed(2)} ${b.currency || 'USD'} — Due: ${b.due_date || 'No Date'} (${formatStatus(b.computed_status || b.status)})`
            ),
            ``,
            `Which invoice would you like details about?`,
          ].join('\n'),
        };
      }
    }

    // General vendor search result
    const total = matchingVendorBills.reduce((s, b) => s + (b.amount || 0), 0);
    return {
      intent: 'vendor_search',
      matchedCount: matchingVendorBills.length,
      answer: [
        `**Bills from ${primaryVendor} (${matchingVendorBills.length} recorded, Total: $${total.toFixed(2)} USD):**`,
        ``,
        ...matchingVendorBills.map(
          (b) =>
            `• **Invoice ${b.invoice_number || 'N/A'}**: $${(b.amount || 0).toFixed(2)} ${b.currency || 'USD'}\n  Due: ${b.due_date || 'No Date'} | Status: ${formatStatus(b.computed_status || b.status)} | Verified: ${b.is_verified === 1 ? 'Yes' : 'Pending Review'}${b.payment_reference ? ` | Note: ${b.payment_reference}` : ''}`
        ),
      ].join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 6. CATEGORY ANALYSIS (Check BEFORE total balance so "how much for utilities" works!)
  // -------------------------------------------------------------
  let matchedCategory: string | null = null;
  for (const [catName, aliases] of Object.entries(CATEGORY_MAP)) {
    if (aliases.some((alias) => matchesWord(q, alias))) {
      matchedCategory = catName;
      break;
    }
  }

  if (matchedCategory) {
    const categoryBills = normalizedBills.filter((b) => {
      const bCat = (b.category || '').toLowerCase();
      const aliases = CATEGORY_MAP[matchedCategory!] || [];
      return bCat.includes(matchedCategory!.toLowerCase()) || aliases.some((a) => bCat.includes(a));
    });

    if (categoryBills.length === 0) {
      return {
        intent: 'category_analysis',
        matchedCount: 0,
        answer: `You currently have **no bills recorded under the ${matchedCategory} category**.`,
      };
    }

    const total = categoryBills.reduce((s, b) => s + (b.amount || 0), 0);
    const unpaid = categoryBills.filter((b) => b.computed_status !== 'paid');
    const unpaidTotal = unpaid.reduce((s, b) => s + (b.amount || 0), 0);

    return {
      intent: 'category_analysis',
      matchedCount: categoryBills.length,
      answer: [
        `**${matchedCategory} Spending Summary:**`,
        ``,
        `Total commitments in ${matchedCategory}: **$${total.toFixed(2)} USD** across ${categoryBills.length} ${categoryBills.length === 1 ? 'bill' : 'bills'}:`,
        unpaid.length > 0
          ? `• **Unpaid / Outstanding**: $${unpaidTotal.toFixed(2)} USD (${unpaid.length} ${unpaid.length === 1 ? 'bill' : 'bills'})`
          : `• **Status**: All bills in this category have been paid!`,
        ``,
        ...categoryBills.map(
          (b) =>
            `• **${b.vendor || b.original_name || 'Vendor'}**: $${(b.amount || 0).toFixed(2)} ${b.currency || 'USD'} (Status: ${formatStatus(b.computed_status || b.status)}, Due: ${b.due_date || 'N/A'})`
        ),
      ].join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 7. FINANCIAL SUMMARY / TOTAL BALANCE
  // -------------------------------------------------------------
  if (
    q.includes('total outstanding') ||
    q.includes('total balance') ||
    q.includes('how much do i owe') ||
    q.includes('what do i owe') ||
    q.includes('total amount due') ||
    q.includes('current balance') ||
    q.includes('total debt') ||
    q.includes('total obligations') ||
    q.includes('financial summary') ||
    q.includes('total unpaid') ||
    (q.includes('total') && (q.includes('bills') || q.includes('invoices') || q.includes('amount') || q.includes('balance')))
  ) {
    const unpaid = normalizedBills.filter((b) => b.computed_status !== 'paid');
    const paid = normalizedBills.filter((b) => b.computed_status === 'paid');

    if (unpaid.length === 0) {
      const paidTotal = paid.reduce((s, b) => s + (b.amount || 0), 0);
      return {
        intent: 'total_balance',
        matchedCount: 0,
        answer: [
          `Your total outstanding balance is **$0.00 USD**.`,
          ``,
          paid.length > 0
            ? `All ${paid.length} recorded ${paid.length === 1 ? 'bill has' : 'bills have'} been settled and paid (Total settled: $${paidTotal.toFixed(2)} USD).`
            : `You currently have zero outstanding obligations recorded in your ledger.`,
        ].join('\n'),
      };
    }

    const totalUnpaid = unpaid.reduce((s, b) => s + (b.amount || 0), 0);
    const overdue = unpaid.filter((b) => b.computed_status === 'overdue');
    const overdueTotal = overdue.reduce((s, b) => s + (b.amount || 0), 0);
    const dueSoon = unpaid.filter((b) => b.computed_status === 'due_soon');
    const dueSoonTotal = dueSoon.reduce((s, b) => s + (b.amount || 0), 0);
    const pending = unpaid.filter((b) => b.computed_status === 'needs_review');
    const pendingTotal = pending.reduce((s, b) => s + (b.amount || 0), 0);

    return {
      intent: 'total_balance',
      matchedCount: unpaid.length,
      answer: [
        `**Total Outstanding Commitments:**`,
        ``,
        `Your total unpaid balance is **$${totalUnpaid.toFixed(2)} USD** across ${unpaid.length} active ${unpaid.length === 1 ? 'bill' : 'bills'}:`,
        `• **Overdue**: $${overdueTotal.toFixed(2)} (${overdue.length} ${overdue.length === 1 ? 'bill' : 'bills'})`,
        `• **Due in Next 7 Days**: $${dueSoonTotal.toFixed(2)} (${dueSoon.length} ${dueSoon.length === 1 ? 'bill' : 'bills'})`,
        pending.length > 0 ? `• **Pending Review**: $${pendingTotal.toFixed(2)} (${pending.length} ${pending.length === 1 ? 'bill' : 'bills'})` : '',
        ``,
        paid.length > 0
          ? `*Settled Archive:* ${paid.length} ${paid.length === 1 ? 'bill totaling' : 'bills totaling'} $${paid.reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)} USD have already been settled.`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 8. OVERDUE BILLS
  // -------------------------------------------------------------
  if (
    q.includes('overdue') ||
    q.includes('past due') ||
    q.includes('late bill') ||
    q.includes('late invoice') ||
    q.includes('missed deadline')
  ) {
    const overdue = normalizedBills.filter((b) => b.computed_status === 'overdue');
    const total = overdue.reduce((s, b) => s + (b.amount || 0), 0);

    if (overdue.length === 0) {
      return {
        intent: 'overdue_bills',
        matchedCount: 0,
        answer: `You currently have **no overdue bills** in your ledger. All recorded obligations are on track or settled.`,
      };
    }

    return {
      intent: 'overdue_bills',
      matchedCount: overdue.length,
      answer: [
        `**Overdue Bills (${overdue.length} ${overdue.length === 1 ? 'bill' : 'bills'} totaling $${total.toFixed(2)} USD):**`,
        ``,
        ...overdue.map(
          (b) =>
            `• **${b.vendor || b.original_name || 'Unknown Vendor'}**: $${(b.amount || 0).toFixed(2)} ${b.currency || 'USD'}\n  Due: ${b.due_date || 'Past Due'} | Invoice: ${b.invoice_number || 'N/A'} | Category: ${b.category || 'Other'}`
        ),
        ``,
        `Action: Open **Invoices & Bills Ledger** to inspect payment details.`,
      ].join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 9. UPCOMING BILLS / DUE IN NEXT 7 DAYS
  // -------------------------------------------------------------
  if (
    q.includes('next seven days') ||
    q.includes('next 7 days') ||
    q.includes('due soon') ||
    q.includes('due this week') ||
    q.includes('upcoming') ||
    q.includes('what is due') ||
    q.includes('due shortly') ||
    q.includes('coming up')
  ) {
    const dueSoon = normalizedBills.filter((b) => b.computed_status === 'due_soon');
    const total = dueSoon.reduce((s, b) => s + (b.amount || 0), 0);

    if (dueSoon.length === 0) {
      return {
        intent: 'upcoming_bills',
        matchedCount: 0,
        answer: `You have **no bills due in the next 7 days**. Your nearest obligations are scheduled further out or already settled.`,
      };
    }

    return {
      intent: 'upcoming_bills',
      matchedCount: dueSoon.length,
      answer: [
        `**Upcoming Bills Due in the Next 7 Days (${dueSoon.length} ${dueSoon.length === 1 ? 'bill' : 'bills'} totaling $${total.toFixed(2)} USD):**`,
        ``,
        ...dueSoon.map(
          (b) =>
            `• **${b.vendor || b.original_name || 'Unknown Vendor'}**: $${(b.amount || 0).toFixed(2)} ${b.currency || 'USD'}\n  Due Date: ${b.due_date || 'Within 7 days'} | Category: ${b.category || 'General'}${b.invoice_number ? ` | Invoice: ${b.invoice_number}` : ''}`
        ),
        ``,
        `Cash flow required this week: **$${total.toFixed(2)} USD**.`,
      ].join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 10. VENDOR NOT FOUND SEARCH
  // -------------------------------------------------------------
  const vendorSearchMatch = q.match(/(?:bills?\s+(?:from|for)|invoices?\s+(?:from|for)|show\s+(?:me\s+)?(?:all\s+)?bills?\s+(?:from|for)?)\s+([a-zA-Z0-9\s&]+)/i);
  if (vendorSearchMatch) {
    const candidateName = vendorSearchMatch[1].trim();
    if (candidateName && candidateName.length > 2) {
      const knownVendors = Array.from(new Set(normalizedBills.map((b) => b.vendor).filter(Boolean)));
      return {
        intent: 'vendor_not_found',
        matchedCount: 0,
        answer: [
          `There are no bills recorded from **${candidateName}** in your ledger.`,
          ``,
          knownVendors.length > 0
            ? `Your recorded vendors include: ${knownVendors.slice(0, 5).join(', ')}.`
            : `No vendors are currently recorded in your ledger.`,
        ].join('\n'),
      };
    }
  }

  // -------------------------------------------------------------
  // 11. UNRELATED OR GENERAL QUESTION LIMITATION
  // -------------------------------------------------------------
  const financialKeywords = [
    'bill', 'bills', 'invoice', 'invoices', 'due', 'date', 'pay', 'paid', 'payment',
    'vendor', 'vendors', 'amount', 'balance', 'owe', 'cost', 'costs', 'spend', 'spending',
    'ledger', 'record', 'records', 'audit', 'receipt', 'statement', 'sloth', 'account',
  ];
  const hasFinancialContext = financialKeywords.some((k) => q.includes(k));

  if (!hasFinancialContext) {
    return {
      intent: 'unrelated_limitation',
      answer: [
        `I am focused on organizing your bills, tracking upcoming deadlines, calculating balances, and managing your financial documents.`,
        ``,
        `I cannot answer general topics outside your financial records, but I can help you with:`,
        `• Checking your total outstanding balance`,
        `• Spotting overdue or upcoming invoices`,
        `• Looking up bills for specific vendors or categories`,
        `• Understanding how BillSloth's local verification works`,
      ].join('\n'),
    };
  }

  // -------------------------------------------------------------
  // 12. AMBIGUOUS FINANCIAL QUERY
  // -------------------------------------------------------------
  return {
    intent: 'ambiguous_clarification',
    answer: [
      `Could you please clarify your question?`,
      ``,
      `For example, you can ask:`,
      `• "What is my total outstanding balance?"`,
      `• "Which bills are overdue?"`,
      `• "What is due in the next seven days?"`,
      `• "Show me all bills from Metro Grid"`,
      `• "How much do I owe for utilities?"`,
    ].join('\n'),
  };
}
