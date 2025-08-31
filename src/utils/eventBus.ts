// Prosty event bus do informowania o zmianach w eventach
class EventBus {
  private listeners: Array<() => void> = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

export const eventBus = new EventBus();
