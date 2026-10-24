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
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
    }
    if (s === 'overdue') {
      return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 font-bold';
    }
    if (s === 'due_soon') {
      return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-medium';
    }
    return 'bg-blue-50 text-navy-800 border-blue-200 hover:bg-blue-100';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner / Month Navigation & Monthly KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">Due Date Calendar</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-blue-light text-brand-blue">
              Monthly Schedule
            </span>
          </div>
          <p className="text-xs text-slate-muted mt-1">
            Visual overview of scheduled bill maturities, settlement deadlines, and cash flow timing
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg border border-slate-border bg-white hover:bg-slate-50 text-navy-800 text-xs font-semibold transition-colors shadow-sm"
          >
            Today
          </button>
          <div className="flex items-center rounded-lg border border-slate-border bg-white shadow-sm overflow-hidden">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 text-navy-800 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-navy-900 min-w-[130px] text-center select-none font-mono">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 text-navy-800 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Financial Health Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="financial-card p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
              Total Commitments
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-navy-900">
              ${totalMonthDue.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-muted block mt-0.5">
              {docsInMonth.length} bills in {format(currentMonth, 'MMMM')}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-navy-900 text-white">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="financial-card p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
              Pending / Due
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-amber-warn">
              ${pendingMonthTotal.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-muted block mt-0.5">
              Awaiting human settlement
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-warn-light text-amber-warn">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="financial-card p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block">
              Settled & Paid
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-green-paid">
              ${paidMonthTotal.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-muted block mt-0.5">
              Completed transactions
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-green-paid-light text-green-paid">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="financial-card overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-light border-b border-slate-border text-center text-xs font-semibold text-navy-800 py-2.5">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-border border-b border-slate-border">
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
                  !inMonth ? 'bg-slate-50/60 opacity-60' : 'bg-white hover:bg-slate-50/80'
                } ${isDaySelected ? 'ring-2 ring-inset ring-brand-blue bg-blue-50/30' : ''}`}
              >
                {/* Date header inside cell */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                      isDayToday
                        ? 'bg-brand-blue text-white font-bold'
                        : isDaySelected
                        ? 'bg-navy-900 text-white font-semibold'
                        : inMonth
                        ? 'text-navy-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayDocs.length > 0 && (
                    <span className="text-[10px] font-mono font-semibold text-slate-muted">
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
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium border truncate block transition-transform hover:scale-[1.02] shadow-xs ${getStatusColor(
                        doc
                      )}`}
                      title={`${doc.vendor || 'Bill'}: $${(doc.amount || 0).toFixed(2)} (${doc.computed_status || doc.status})`}
                    >
                      <span className="font-semibold">{doc.vendor || 'Bill'}</span>{' '}
                      <span className="font-mono tabular-nums">${(doc.amount || 0).toFixed(0)}</span>
                    </button>
                  ))}
                  {dayDocs.length > 3 && (
                    <span className="text-[9px] text-slate-500 font-medium block text-center">
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
      <div className="financial-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-bold text-navy-900">
              Schedule for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            {isToday(selectedDate) && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-blue-light text-brand-blue font-bold">
                Today
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-slate-muted">
            {selectedDocs.length} {selectedDocs.length === 1 ? 'obligation' : 'obligations'}
          </span>
        </div>

        {selectedDocs.length === 0 ? (
          <div className="py-8 text-center text-slate-muted text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-medium text-navy-800">No payment obligations due on this date</p>
            <p className="text-[11px] text-slate-muted mt-0.5">
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
                  className="p-3.5 rounded-xl border border-slate-border bg-slate-light/60 flex flex-col justify-between space-y-3 hover:bg-slate-light transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900 text-xs">
                          {doc.vendor || doc.original_name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded font-semibold capitalize ${
                            status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : status === 'due_soon'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-navy-800'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-muted mt-0.5">
                        Invoice: <span className="font-mono text-navy-800">{doc.invoice_number || 'None'}</span> • Category: {doc.category || 'Other'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono tabular-nums text-navy-900 block">
                        ${(doc.amount || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-muted font-mono">{doc.currency || 'USD'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <button
                      onClick={() => onOpenReview(doc)}
                      className="px-2.5 py-1 rounded-lg border border-slate-border bg-white hover:bg-slate-100 text-navy-900 font-semibold transition-colors"
                    >
                      Inspect & Review
                    </button>

                    <div className="flex items-center gap-1.5">
                      {status !== 'paid' && onQuickMarkPaid && (
                        <button
                          onClick={() => onQuickMarkPaid(doc)}
                          className="px-2.5 py-1 rounded-lg bg-green-paid-light text-green-paid border border-green-paid-border hover:bg-green-100 font-semibold transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {onPrepareReminder && (
                        <button
                          onClick={() => onPrepareReminder(doc)}
                          className="px-2 py-1 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-200 transition-colors"
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
