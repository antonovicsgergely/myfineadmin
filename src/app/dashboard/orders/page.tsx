export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Rendelések</h2>
      
      <div className="glass p-8 rounded-2xl shadow-sm border border-border/50 text-center py-20">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          📦
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Jelenleg nincsenek rendeléseid</h3>
        <p className="text-foreground/70 max-w-md mx-auto">
          Amint egy vásárló megrendeli a termékeidet a My Fine piactéren keresztül, itt fognak megjelenni a rendelés részletei.
        </p>
      </div>
    </div>
  );
}
