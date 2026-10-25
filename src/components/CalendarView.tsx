import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { DocumentItem } from '../types';

interface CalendarViewProps {
  documents: DocumentItem[];
  onOpenReview: (doc: DocumentItem) => void;
  onQuickMarkPaid?: (doc: DocumentItem) => void;
  onPrepareReminder?: (doc: DocumentItem) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  documents,
  onOpenReview,
  onQuickMarkPaid,
  onPrepareReminder,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  // Group documents by their due date (or issue date if no due date)
  const getDocsForDate = (date: Date): DocumentItem[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return documents.filter((doc) => {
      const docDate = doc.due_date || doc.issue_date;
      return docDate === dateStr;
    });
  };

  // Monthly stats
  const docsInMonth = documents.filter((doc) => {
    const docDate = doc.due_date || doc.issue_date;
    if (!docDate) return false;
    try {
      const parsed = parseISO(docDate);
      return isSameMonth(parsed, currentMonth);
    } catch {
      return false;
    }
  });

  const totalMonthDue = docsInMonth.reduce((sum, d) => sum + (d.amount || 0), 0);
  const paidMonthTotal = docsInMonth
    .filter((d) => (d.computed_status || d.status) === 'paid')
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const pendingMonthTotal = totalMonthDue - paidMonthTotal;

  // Selected date documents
  const selectedDocs = getDocsForDate(selectedDate);

  const getStatusColor = (doc: DocumentItem) => {
    const s = doc.computed_status || doc.status;
    if (s === 'paid') {
      return 'bg-[#DDF7EF] text-[#087F5B] border-[#087F5B]/30 hover:bg-[#BBF7D0]';
    }
    if (s === 'overdue') {
      return 'bg-[#FFE4E6] text-[#BE123C] border-[#BE123C]/40 hover:bg-[#FECDD3] font-bold';
    }
    if (s === 'due_soon') {
      return 'bg-[#FFF0CC] text-[#854D0E] border-[#854D0E]/40 hover:bg-[#FDE68A] font-semibold';
    }
    return 'bg-[#DDF5F6] text-[#087F8C] border-[#087F8C]/30 hover:bg-[#CCF0F3]';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-[#172A35]">
      {/* Top Banner / Month Navigation & Monthly KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#172A35] tracking-tight">Due Date Calendar</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30">
              Monthly Schedule
            </span>
          </div>
          <p className="text-xs text-[#526572] mt-1">
            Visual overview of scheduled bill maturities, settlement deadlines, and cash flow timing
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#172A35] text-xs font-semibold transition-colors shadow-xs"
          >
            Today
          </button>
          <div className="flex items-center rounded-lg border border-[#DCE4E5] bg-white shadow-xs overflow-hidden">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 text-[#526572] hover:text-[#172A35] hover:bg-[#F7F8F5] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-[#172A35] min-w-[130px] text-center select-none font-mono">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 text-[#526572] hover:text-[#172A35] hover:bg-[#F7F8F5] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Financial Health Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#DCE4E5] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-[#526572] uppercase tracking-wider block">
              Total Commitments
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#172A35]">
              ${totalMonthDue.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#526572] block mt-0.5">
              {docsInMonth.length} bills in {format(currentMonth, 'MMMM')}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/20">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#DCE4E5] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-[#854D0E] uppercase tracking-wider block">
              Pending / Due
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#854D0E]">
              ${pendingMonthTotal.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#526572] block mt-0.5">
              Awaiting human settlement
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FFF0CC] text-[#854D0E] border border-[#854D0E]/30">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#DCE4E5] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-[#087F5B] uppercase tracking-wider block">
              Settled & Paid
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#087F5B]">
              ${paidMonthTotal.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#526572] block mt-0.5">
              Completed transactions
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white border border-[#DCE4E5] rounded-xl overflow-hidden shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-[#F7F8F5] border-b border-[#DCE4E5] text-center text-xs font-semibold text-[#526572] py-2.5">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#DCE4E5] border-b border-[#DCE4E5]">
          {calendarDays.map((day, idx) => {
            const inMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            const isDaySelected = isSameDay(day, selectedDate);
            const dayDocs = getDocsForDate(day);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[110px] p-1.5 flex flex-col justify-between cursor-pointer transition-colors ${
                  !inMonth ? 'bg-[#F7F8F5]/60 opacity-40' : 'bg-white hover:bg-[#F7F8F5]'
                } ${isDaySelected ? 'ring-2 ring-inset ring-[#087F8C] bg-[#DDF5F6]/30' : ''}`}
              >
                {/* Date header inside cell */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                      isDayToday
                        ? 'bg-[#087F8C] text-white font-bold shadow-xs'
                        : isDaySelected
                        ? 'bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/40 font-bold'
                        : inMonth
                        ? 'text-[#172A35]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayDocs.length > 0 && (
                    <span className="text-[10px] font-mono font-semibold text-[#526572]">
                      {dayDocs.length} {dayDocs.length === 1 ? 'bill' : 'bills'}
                    </span>
                  )}
                </div>

                {/* Bill chips inside cell */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {dayDocs.slice(0, 3).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReview(doc);
                      }}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium border truncate block transition-transform hover:scale-[1.02] shadow-2xs ${getStatusColor(
                        doc
                      )}`}
                      title={`${doc.vendor || 'Bill'}: $${(doc.amount || 0).toFixed(2)} (${doc.computed_status || doc.status})`}
                    >
                      <span className="font-semibold">{doc.vendor || 'Bill'}</span>{' '}
                      <span className="font-mono tabular-nums">${(doc.amount || 0).toFixed(0)}</span>
                    </button>
                  ))}
                  {dayDocs.length > 3 && (
                    <span className="text-[9px] text-[#526572] font-medium block text-center">
                      +{dayDocs.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Panel */}
      <div className="bg-white border border-[#DCE4E5] rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#DCE4E5] pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#087F8C]" />
            <h3 className="text-sm font-bold text-[#172A35]">
              Schedule for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            {isToday(selectedDate) && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#DDF5F6] text-[#087F8C] border border-[#087F8C]/30 font-bold">
                Today
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-[#526572]">
            {selectedDocs.length} {selectedDocs.length === 1 ? 'obligation' : 'obligations'}
          </span>
        </div>

        {selectedDocs.length === 0 ? (
          <div className="py-8 text-center text-[#526572] text-xs">
            <CheckCircle2 className="w-6 h-6 text-[#087F5B] mx-auto mb-1.5" />
            <p className="font-medium text-[#172A35]">No payment obligations due on this date</p>
            <p className="text-[11px] text-[#526572] mt-0.5">
              Click on any day on the calendar grid to inspect scheduled bills or upload new statements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDocs.map((doc) => {
              const status = doc.computed_status || doc.status;
              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-[#DCE4E5] bg-[#F7F8F5] flex flex-col justify-between space-y-3 hover:border-[#087F8C]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172A35] text-xs">
                          {doc.vendor || doc.original_name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize border ${
                            status === 'paid'
                              ? 'bg-[#DDF7EF] text-[#087F5B] border-[#087F5B]/30'
                              : status === 'overdue'
                              ? 'bg-[#FFE4E6] text-[#BE123C] border-[#BE123C]/40'
                              : status === 'due_soon'
                              ? 'bg-[#FFF0CC] text-[#854D0E] border-[#854D0E]/40'
                              : 'bg-[#DDF5F6] text-[#087F8C] border-[#087F8C]/30'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#526572] mt-0.5">
                        Invoice: <span className="font-mono text-[#172A35]">{doc.invoice_number || 'None'}</span> • Category: {doc.category || 'Other'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono tabular-nums text-[#172A35] block">
                        ${(doc.amount || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[#526572] font-mono">{doc.currency || 'USD'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#DCE4E5] text-xs">
                    <button
                      onClick={() => onOpenReview(doc)}
                      className="px-2.5 py-1 rounded-lg border border-[#DCE4E5] bg-white hover:bg-[#F7F8F5] text-[#172A35] font-semibold transition-colors"
                    >
                      Inspect & Review
                    </button>

                    <div className="flex items-center gap-1.5">
                      {status !== 'paid' && onQuickMarkPaid && (
                        <button
                          onClick={() => onQuickMarkPaid(doc)}
                          className="px-2.5 py-1 rounded-lg bg-[#DDF7EF] text-[#087F5B] border border-[#087F5B]/40 hover:bg-[#087F5B] hover:text-white font-semibold transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {onPrepareReminder && (
                        <button
                          onClick={() => onPrepareReminder(doc)}
                          className="px-2 py-1 rounded-lg text-[#526572] hover:text-[#087F8C] hover:bg-white transition-colors"
                          title="Schedule Reminder"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
