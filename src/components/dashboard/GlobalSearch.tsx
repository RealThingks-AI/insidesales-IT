import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Users, FileText, Briefcase, Building2, Calendar, ListTodo, Settings, Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'lead' | 'contact' | 'deal' | 'account' | 'meeting' | 'task' | 'setting';
  title: string;
  subtitle?: string;
  route: string;
}

const typeIcons = {
  lead: FileText,
  contact: Users,
  deal: Briefcase,
  account: Building2,
  meeting: Calendar,
  task: ListTodo,
  setting: Settings,
};

const typeLabels = {
  lead: 'Lead',
  contact: 'Contact',
  deal: 'Deal',
  account: 'Account',
  meeting: 'Meeting',
  task: 'Task',
  setting: 'Setting',
};

const typeColors = {
  lead: 'text-blue-500',
  contact: 'text-green-500',
  deal: 'text-purple-500',
  account: 'text-orange-500',
  meeting: 'text-cyan-500',
  task: 'text-yellow-500',
  setting: 'text-gray-500',
};

// Settings pages for navigation
const settingsPages = [
  { id: 'profile', title: 'Profile Settings', subtitle: 'Manage your profile', route: '/settings?tab=profile' },
  { id: 'display', title: 'Display Settings', subtitle: 'Theme and appearance', route: '/settings?tab=display' },
  { id: 'notifications', title: 'Notification Settings', subtitle: 'Email and alerts', route: '/settings?tab=notifications' },
  { id: 'security', title: 'Security Settings', subtitle: 'Password and sessions', route: '/settings?tab=security' },
  { id: 'pipeline', title: 'Pipeline Settings', subtitle: 'Deal stages', route: '/settings?tab=pipeline' },
  { id: 'integrations', title: 'Integrations', subtitle: 'Connect services', route: '/settings?tab=integrations' },
];

export const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Search query
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];

      const searchTerm = `%${query.toLowerCase()}%`;
      const searchResults: SearchResult[] = [];

      // Search leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, lead_name, company_name, email')
        .or(`lead_name.ilike.${searchTerm},company_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5);

      if (leads) {
        leads.forEach(lead => {
          searchResults.push({
            id: lead.id,
            type: 'lead',
            title: lead.lead_name,
            subtitle: lead.company_name || lead.email || undefined,
            route: `/leads?highlight=${lead.id}`,
          });
        });
      }

      // Search contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, contact_name, company_name, email')
        .or(`contact_name.ilike.${searchTerm},company_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5);

      if (contacts) {
        contacts.forEach(contact => {
          searchResults.push({
            id: contact.id,
            type: 'contact',
            title: contact.contact_name,
            subtitle: contact.company_name || contact.email || undefined,
            route: `/contacts?highlight=${contact.id}`,
          });
        });
      }

      // Search deals
      const { data: deals } = await supabase
        .from('deals')
        .select('id, deal_name, customer_name, stage')
        .or(`deal_name.ilike.${searchTerm},customer_name.ilike.${searchTerm},project_name.ilike.${searchTerm}`)
        .limit(5);

      if (deals) {
        deals.forEach(deal => {
          searchResults.push({
            id: deal.id,
            type: 'deal',
            title: deal.deal_name,
            subtitle: deal.customer_name || deal.stage || undefined,
            route: `/deals?highlight=${deal.id}`,
          });
        });
      }

      // Search accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, company_name, industry, email')
        .or(`company_name.ilike.${searchTerm},industry.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5);

      if (accounts) {
        accounts.forEach(account => {
          searchResults.push({
            id: account.id,
            type: 'account',
            title: account.company_name,
            subtitle: account.industry || account.email || undefined,
            route: `/accounts?highlight=${account.id}`,
          });
        });
      }

      // Search meetings
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, subject, description')
        .or(`subject.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (meetings) {
        meetings.forEach(meeting => {
          searchResults.push({
            id: meeting.id,
            type: 'meeting',
            title: meeting.subject,
            subtitle: meeting.description?.substring(0, 50) || undefined,
            route: `/meetings?highlight=${meeting.id}`,
          });
        });
      }

      // Search tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description, status')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (tasks) {
        tasks.forEach(task => {
          searchResults.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: task.status || undefined,
            route: `/tasks?highlight=${task.id}`,
          });
        });
      }

      // Search settings pages
      const matchedSettings = settingsPages.filter(
        page => 
          page.title.toLowerCase().includes(query.toLowerCase()) ||
          page.subtitle.toLowerCase().includes(query.toLowerCase())
      );

      matchedSettings.forEach(setting => {
        searchResults.push({
          id: setting.id,
          type: 'setting',
          title: setting.title,
          subtitle: setting.subtitle,
          route: setting.route,
        });
      });

      return searchResults;
    },
    enabled: query.length >= 2,
    staleTime: 1000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.route);
    setQuery("");
    setIsOpen(false);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search leads, contacts, deals, accounts..."
        className="pl-9 w-full"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      
      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="py-2">
                {Object.entries(groupedResults).map(([type, items]) => {
                  const Icon = typeIcons[type as keyof typeof typeIcons];
                  return (
                    <div key={type}>
                      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                        {typeLabels[type as keyof typeof typeLabels]}s
                      </div>
                      {items.map((result) => {
                        const resultIndex = results.indexOf(result);
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors",
                              resultIndex === selectedIndex && "bg-accent"
                            )}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(resultIndex)}
                          >
                            <Icon className={cn("w-4 h-4 flex-shrink-0", typeColors[result.type])} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};
