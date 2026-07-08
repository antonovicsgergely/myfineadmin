export default function VendorDashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Üdvözlünk a Vendor Portálon</h2>
        <p className="text-sm text-foreground/60 mt-1">Tekintsd meg fiókod aktuális statisztikáit és feladataidat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blue Davinci Style Banner */}
        <div className="lg:col-span-1 bg-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-primary/30 flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              AKTÍV FIÓK
            </div>
            <h3 className="text-2xl font-bold mb-2">Minden rendszer online</h3>
            <p className="text-white/80 text-sm">A termék szinkronizáció és a rendeléskezelés zavartalanul működik az Unas áruház felé.</p>
          </div>
          <button className="mt-6 bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-semibold py-2.5 px-4 rounded-xl text-left flex justify-between items-center border border-white/20">
            <span>Részletek megtekintése</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Info/Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center h-full">
            <h3 className="text-sm font-semibold text-foreground/60 mb-2 uppercase tracking-wide">Havi Bevétel</h3>
            <p className="text-4xl font-extrabold text-foreground">0 Ft</p>
          </div>
          <div className="glass p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center h-full">
            <h3 className="text-sm font-semibold text-foreground/60 mb-2 uppercase tracking-wide">Új Rendelések</h3>
            <p className="text-4xl font-extrabold text-secondary">0 <span className="text-lg font-medium text-foreground/50">db</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="glass p-8 rounded-2xl shadow-sm border border-border/50 min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 text-2xl">
            📊
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Értékesítési Statisztika</h3>
          <p className="text-foreground/60 max-w-sm">
            Nincs elegendő adat a grafikon megjelenítéséhez. Tölts fel termékeket, hogy beinduljanak az eladások!
          </p>
        </div>

        <div className="glass p-8 rounded-2xl shadow-sm border border-border/50">
          <h3 className="text-lg font-bold text-foreground mb-6">Top Termékek (Ebben a hónapban)</h3>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-foreground/50">Még nincsenek értékesített termékek.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
