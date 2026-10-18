'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { formatPrice, formatTime } from '@/i18n/config';

const timeSlots = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];

export default function Contact() {
  const { t, data, lang } = useLanguage();
  const { BUSINESS_INFO, SERVICES_CATEGORIES, SERVICES_DATA, SPECIALISTS_DATA } = data;
  // Booking Form State
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [service, setService] = useState('');
  const [specialist, setSpecialist] = useState('any');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [bookingCode, setBookingCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen to quick booking events from Hero or Services
  useEffect(() => {
    const handleQuickBook = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { category: cat, date: dt } = customEvent.detail;
        if (cat) setCategory(cat);
        if (dt) setDate(dt);
        setStep(1); // Set to step 1 so they see the prefilled values
      }
    };

    const handleServiceBook = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { serviceId } = customEvent.detail;
        const found = SERVICES_DATA.find((s) => s.id === serviceId);
        if (found) {
          setCategory(found.category);
          setService(found.id);
          setStep(2); // Jump to specialist selection since service is decided
        }
      }
    };

    window.addEventListener('quick-booking-select', handleQuickBook);
    window.addEventListener('service-booking-select', handleServiceBook);

    return () => {
      window.removeEventListener('quick-booking-select', handleQuickBook);
      window.removeEventListener('service-booking-select', handleServiceBook);
    };
  }, [SERVICES_DATA]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setClientInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (step === 1 && (!category || !service)) return;
    if (step === 2 && !specialist) return;
    if (step === 3 && (!date || !timeSlot)) return;
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) return;

    setIsSubmitting(true);
    // Simulate API request delay
    setTimeout(() => {
      const code = 'WRM-' + Math.floor(100000 + Math.random() * 900000);
      setBookingCode(code);
      setIsSubmitting(false);
      setStep(5); // Go to success page
    }, 1500);
  };

  const handleResetForm = () => {
    setStep(1);
    setCategory('');
    setService('');
    setSpecialist('any');
    setDate('');
    setTimeSlot('');
    setClientInfo({
      name: '',
      email: '',
      phone: '',
      notes: '',
    });
    setBookingCode('');
  };

  // Filter services matching chosen category
  const filteredServicesList = SERVICES_DATA.filter((s) => s.category === category);
  const activeServiceObj = SERVICES_DATA.find((s) => s.id === service);
  const activeSpecialistObj = SPECIALISTS_DATA.find((s) => s.id === specialist);

  return (
    <section id="contact" className="py-28 bg-aura-bg relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Column Left: Contact Details, Map & Hours */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-4">
              <span className="text-xs font-semibold tracking-[0.2em] text-aura-accent uppercase">{t.contact.eyebrow}</span>
              <h2 className="text-3xl md:text-4xl font-serif text-aura-text">
                {t.contact.title}
              </h2>
              <div className="h-[2px] w-12 bg-aura-accent"></div>
              <p className="text-sm text-aura-muted font-light leading-relaxed">
                {t.contact.intro}
              </p>
            </div>

            {/* Info Cards Column */}
            <div className="space-y-4">
              {/* Card Address */}
              <div className="flex items-start space-x-4 p-5 bg-white border border-aura-border rounded-[20px] shadow-premium hover:-translate-y-0.5 hover:shadow-premium-hover transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-aura-primary/50 text-aura-accent">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-wider text-aura-text uppercase">{t.contact.address}</h4>
                  <p className="text-xs md:text-sm text-aura-muted font-light mt-1">{BUSINESS_INFO.address}</p>
                </div>
              </div>

              {/* Card Hours */}
              <div className="flex items-start space-x-4 p-5 bg-white border border-aura-border rounded-[20px] shadow-premium hover:-translate-y-0.5 hover:shadow-premium-hover transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-aura-primary/50 text-aura-accent">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="w-full space-y-1">
                  <h4 className="text-xs font-semibold tracking-wider text-aura-text uppercase">{t.contact.hours}</h4>
                  <div className="grid grid-cols-2 text-xs text-aura-muted font-light pt-1 gap-y-1">
                    <span>{t.contact.weekdays}</span>
                    <span className="text-end font-medium text-aura-text">{BUSINESS_INFO.hours.weekdays}</span>
                    <span>{t.contact.saturday}</span>
                    <span className="text-end font-medium text-aura-text">{BUSINESS_INFO.hours.saturday}</span>
                    <span>{t.contact.sunday}</span>
                    <span className="text-end font-medium text-aura-text">{BUSINESS_INFO.hours.sunday}</span>
                  </div>
                </div>
              </div>

              {/* Card Phone/Email */}
              <div className="flex items-start space-x-4 p-5 bg-white border border-aura-border rounded-[20px] shadow-premium hover:-translate-y-0.5 hover:shadow-premium-hover transition-all duration-300">
                <div className="p-2.5 rounded-xl bg-aura-primary/50 text-aura-accent">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-wider text-aura-text uppercase">{t.contact.directContacts}</h4>
                  <p className="text-xs md:text-sm text-aura-text font-medium mt-1"><span dir="ltr">{BUSINESS_INFO.phone}</span></p>
                  <p className="text-xs md:text-sm text-aura-muted font-light"><span dir="ltr">{BUSINESS_INFO.email}</span></p>
                </div>
              </div>
            </div>

            {/* Desaturated Google Map Iframe block */}
            <div className="relative aspect-video rounded-[20px] overflow-hidden border border-aura-border shadow-premium">
              <iframe
                title={t.contact.mapTitle}
                src={BUSINESS_INFO.mapCoordinates}
                className="w-full h-full border-0 desaturate-[60%] contrast-[95%] opacity-90"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Column Right: Interactive Multi-step Booking Form */}
          <div className="lg:col-span-7 bg-white rounded-[20px] p-8 md:p-12 border border-aura-border shadow-premium transition-all duration-300 hover:shadow-premium-hover">
            <h3 className="font-serif text-2xl text-aura-text mb-2">{t.contact.formTitle}</h3>
            <p className="text-xs text-aura-muted font-light mb-8">{t.contact.formIntro}</p>

            {/* Stepper Progress Indicator */}
            {step < 5 && (
              <div className="flex items-center justify-between mb-8 relative">
                {/* Horizontal progress bar track */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-aura-bg z-0" />
                <div
                  className="absolute start-0 top-1/2 -translate-y-1/2 h-[2px] bg-aura-accent transition-all duration-500 z-0"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />

                {[1, 2, 3, 4].map((num) => (
                  <div
                    key={num}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10 transition-colors duration-500 ${
                      step >= num
                        ? 'bg-aura-accent text-white shadow-sm shadow-aura-accent/20'
                        : 'bg-aura-bg text-aura-muted border border-aura-border'
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}

            {/* Form Steps Rendering with AnimatePresence */}
            <form onSubmit={handleSubmitBooking} className="min-h-[340px] flex flex-col justify-between">
              
              <div className="flex-grow">
                {/* STEP 1: Select Service Category & Service */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h4 className="text-sm font-semibold tracking-wider text-aura-text uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-aura-accent" />
                      <span>{t.contact.step1}</span>
                    </h4>

                    {/* Select Category */}
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="booking-category" className="text-xs text-aura-text font-medium">{t.contact.category}</label>
                      <select
                        id="booking-category"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setService(''); // Reset service selection when category changes
                        }}
                        className="w-full bg-aura-bg/50 border border-aura-border rounded-xl px-4 py-3 text-sm text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all cursor-pointer"
                        required
                      >
                        <option value="">{t.contact.chooseCategory}</option>
                        {SERVICES_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Service (only enabled when category is selected) */}
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="booking-service" className="text-xs text-aura-text font-medium">{t.contact.service}</label>
                      <select
                        id="booking-service"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className={`w-full bg-aura-bg/50 border border-aura-border rounded-xl px-4 py-3 text-sm text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all cursor-pointer ${
                          !category ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={!category}
                        required
                      >
                        <option value="">{t.contact.chooseService}</option>
                        {filteredServicesList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({formatPrice(s.price, lang)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Choose Specialist */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h4 className="text-sm font-semibold tracking-wider text-aura-text uppercase flex items-center gap-2">
                      <User className="w-4 h-4 text-aura-accent" />
                      <span>{t.contact.step2}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Specialist Option: Any Available */}
                      <label
                        className={`p-4 rounded-2xl border-2 flex items-center space-x-3 cursor-pointer transition-all ${
                          specialist === 'any'
                            ? 'border-aura-accent bg-aura-primary/10'
                            : 'border-aura-border hover:border-aura-accent/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="specialist"
                          value="any"
                          checked={specialist === 'any'}
                          onChange={() => setSpecialist('any')}
                          className="sr-only"
                        />
                        <div className="w-10 h-10 rounded-full bg-aura-primary flex items-center justify-center text-aura-accent font-serif font-bold text-sm">
                          {t.contact.anyInitial}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-aura-text">{t.contact.anySpecialist}</p>
                          <p className="text-[10px] text-aura-muted">{t.contact.bestAvailable}</p>
                        </div>
                      </label>

                      {/* Specialist Options: Team DB */}
                      {SPECIALISTS_DATA.map((spc) => (
                        <label
                          key={spc.id}
                          className={`p-4 rounded-2xl border-2 flex items-center space-x-3 cursor-pointer transition-all ${
                            specialist === spc.id
                              ? 'border-aura-accent bg-aura-primary/10'
                              : 'border-aura-border hover:border-aura-accent/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name="specialist"
                            value={spc.id}
                            checked={specialist === spc.id}
                            onChange={() => setSpecialist(spc.id)}
                            className="sr-only"
                          />
                          <div className="w-10 h-10 rounded-full bg-aura-primary flex items-center justify-center text-aura-accent font-serif font-bold text-sm flex-shrink-0">
                            {spc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-aura-text">{spc.name}</p>
                            <p className="text-[10px] text-aura-muted">{spc.shortRole}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Select Date & Time Slot */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h4 className="text-sm font-semibold tracking-wider text-aura-text uppercase flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-aura-accent" />
                      <span>{t.contact.step3}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Date Select */}
                      <div className="flex flex-col space-y-2">
                        <label htmlFor="booking-date" className="text-xs text-aura-text font-medium">{t.contact.selectDate}</label>
                        <input
                          id="booking-date"
                          type="date"
                          value={date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-aura-bg/50 border border-aura-border rounded-xl px-4 py-3 text-sm text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all cursor-pointer"
                          required
                        />
                      </div>

                      {/* Time Slots List */}
                      <div className="flex flex-col space-y-2">
                        <label className="text-xs text-aura-text font-medium">{t.contact.selectTime}</label>
                        <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pe-1">
                          {timeSlots.map((time) => (
                            <button
                              type="button"
                              key={time}
                              onClick={() => setTimeSlot(time)}
                              className={`py-2 px-3 text-xs rounded-xl border text-center font-medium transition-all ${
                                timeSlot === time
                                  ? 'bg-aura-accent text-white border-aura-accent shadow-sm'
                                  : 'bg-aura-bg/50 border-aura-border text-aura-text hover:border-aura-accent/30'
                              }`}
                            >
                              {formatTime(time, lang)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Client Contact Information & Booking Summary */}
                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                  >
                    {/* Sub-column inputs */}
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="text-sm font-semibold tracking-wider text-aura-text uppercase flex items-center gap-2">
                        <Mail className="w-4 h-4 text-aura-accent" />
                        <span>{t.contact.step4}</span>
                      </h4>

                      <div className="flex flex-col space-y-1.5">
                        <label htmlFor="booking-name" className="text-xs text-aura-text font-medium">{t.contact.fullName}</label>
                        <input
                          id="booking-name"
                          type="text"
                          name="name"
                          value={clientInfo.name}
                          onChange={handleInputChange}
                          className="w-full bg-aura-bg/50 border border-aura-border rounded-xl px-4 py-2.5 text-xs text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all"
                          placeholder={t.contact.namePlaceholder}
                          required
                        />
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <label htmlFor="booking-email" className="text-xs text-aura-text font-medium">{t.contact.email}</label>
                        <input
                          id="booking-email"
                          type="email"
                          name="email"
                          value={clientInfo.email}
                          onChange={handleInputChange}
                          className="w-full bg-aura-bg/50 border border-aura-border rounded-xl px-4 py-2.5 text-xs text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all"
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <label htmlFor="booking-phone" className="text-xs text-aura-text font-medium">{t.contact.phone}</label>
                        <input
                          id="booking-phone"
                          type="tel"
                          name="phone"
                          value={clientInfo.phone}
                          onChange={handleInputChange}
                          className="w-full bg-aura-bg/50 border border-aura-border rounded-xl px-4 py-2.5 text-xs text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all"
                          placeholder="+1 (555) 000-0000"
                          dir="ltr"
                          required
                        />
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <label htmlFor="booking-notes" className="text-xs text-aura-text font-medium">{t.contact.notes}</label>
                        <textarea
                          id="booking-notes"
                          name="notes"
                          rows={2}
                          value={clientInfo.notes}
                          onChange={handleInputChange}
                          className="w-full bg-aura-bg/50 border border-aura-border rounded-xl px-4 py-2 text-xs text-aura-text outline-none focus:border-aura-accent focus:bg-white transition-all resize-none"
                          placeholder={t.contact.notesPlaceholder}
                        />
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="lg:col-span-5 bg-aura-bg/50 rounded-2xl p-5 border border-aura-border space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h5 className="text-[10px] uppercase tracking-widest font-semibold text-aura-accent">{t.contact.summary}</h5>
                        
                        <div className="space-y-2 text-xs text-aura-text font-light">
                          <p className="border-b border-aura-border pb-1">
                            <span className="font-semibold block text-aura-text/80">{t.contact.treatment}</span>
                            {activeServiceObj?.name}
                          </p>
                          <p className="border-b border-aura-border pb-1">
                            <span className="font-semibold block text-aura-text/80">{t.contact.practitioner}</span>
                            {specialist === 'any' ? t.contact.anyAvailable : activeSpecialistObj?.name}
                          </p>
                          <p className="border-b border-aura-border pb-1">
                            <span className="font-semibold block text-aura-text/80">{t.contact.dateTime}</span>
                            {date} {t.contact.at} {timeSlot && formatTime(timeSlot, lang)}
                          </p>
                          <p className="flex justify-between font-serif text-sm pt-2">
                            <span>{t.contact.totalPrice}</span>
                            <span className="text-aura-accent font-semibold">{activeServiceObj && formatPrice(activeServiceObj.price, lang)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Success confirmation */}
                {step === 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-6 flex flex-col items-center justify-center"
                  >
                    <div className="p-4 rounded-full bg-green-50 text-green-500 shadow-sm">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-serif text-2xl text-aura-text">{t.contact.confirmed}</h4>
                      <p className="text-sm text-aura-muted font-light max-w-md mx-auto">
                        {t.contact.thankYou} <span className="font-semibold text-aura-text">{clientInfo.name}</span>. {t.contact.confirmedMessage}
                      </p>
                    </div>

                    <div className="p-4 bg-aura-bg/50 border border-aura-border rounded-2xl w-full max-w-sm">
                      <p className="text-[10px] uppercase tracking-widest text-aura-muted">{t.contact.reservationCode}</p>
                      <p className="text-xl font-mono font-bold text-aura-accent tracking-widest mt-1">{bookingCode}</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-6 py-2.5 bg-aura-accent hover:bg-aura-accent-hover text-white font-semibold text-xs tracking-widest uppercase rounded-full shadow-sm hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      {t.contact.bookAnother}
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Navigation Row */}
              {step < 5 && (
                <div className="flex items-center justify-between border-t border-aura-border pt-6 mt-6">
                  {/* Prev Button */}
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-5 py-2.5 border border-aura-accent/25 hover:border-aura-accent text-aura-accent hover:bg-aura-primary/20 rounded-full text-xs font-semibold tracking-widest uppercase flex items-center space-x-1.5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                      <span>{t.contact.back}</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {/* Next / Submit Button */}
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={(step === 1 && (!category || !service)) || (step === 3 && (!date || !timeSlot))}
                      className="px-5 py-2.5 bg-aura-accent text-white hover:bg-aura-accent-hover disabled:opacity-50 rounded-full text-xs font-semibold tracking-widest uppercase flex items-center space-x-1.5 hover:-translate-y-0.5 shadow-sm transition-all duration-300 cursor-pointer"
                    >
                      <span>{t.contact.next}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !clientInfo.name || !clientInfo.email || !clientInfo.phone}
                      className="px-8 py-3.5 bg-aura-accent text-white hover:bg-aura-accent-hover disabled:opacity-50 rounded-full text-xs font-semibold tracking-widest uppercase shadow-md shadow-aura-accent/15 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    >
                      {isSubmitting ? t.contact.submitting : t.contact.confirm}
                    </button>
                  )}
                </div>
              )}

            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
