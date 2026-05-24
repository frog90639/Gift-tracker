import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Gift, Calendar, User, Trash2, Check, Clock } from 'lucide-react';

export default function GiftTracker() {
  const [people, setPeople] = useState(() => {
    try {
      const saved = localStorage.getItem('giftTrackerData');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          name: 'Sarah',
          birthday: '06-15',
          budget: 75,
          notes: 'Loves coffee and books',
          gifts: [
            { id: 1, idea: 'Coffee maker', purchased: false, price: 45 },
            { id: 2, idea: 'Book series', purchased: true, price: 35 }
          ]
        }
      ];
    } catch {
      return [
        {
          id: 1,
          name: 'Sarah',
          birthday: '06-15',
          budget: 75,
          notes: 'Loves coffee and books',
          gifts: [
            { id: 1, idea: 'Coffee maker', purchased: false, price: 45 },
            { id: 2, idea: 'Book series', purchased: true, price: 35 }
          ]
        }
      ];
    }
  });

  // Save to localStorage whenever people changes
  React.useEffect(() => {
    try {
      localStorage.setItem('giftTrackerData', JSON.stringify(people));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [people]);

  const [view, setView] = useState('people');
  const [expandedPerson, setExpandedPerson] = useState(null);

  const addPerson = () => {
    const newId = Math.max(...people.map(p => p.id), 0) + 1;
    setPeople([...people, {
      id: newId,
      name: 'New Person',
      birthday: '01-01',
      budget: 50,
      notes: '',
      gifts: []
    }]);
    setExpandedPerson(newId);
  };

  const updatePerson = (id, updates) => {
    setPeople(people.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePerson = (id) => {
    setPeople(people.filter(p => p.id !== id));
  };

  const addGift = (personId) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    const newGiftId = Math.max(...(person.gifts?.map(g => g.id) || [0]), 0) + 1;
    updatePerson(personId, {
      gifts: [...(person.gifts || []), { id: newGiftId, idea: 'New gift', purchased: false, price: 0 }]
    });
  };

  const updateGift = (personId, giftId, updates) => {
    const person = people.find(p => p.id === personId);
    updatePerson(personId, {
      gifts: person.gifts.map(g => g.id === giftId ? { ...g, ...updates } : g)
    });
  };

  const deleteGift = (personId, giftId) => {
    const person = people.find(p => p.id === personId);
    updatePerson(personId, {
      gifts: person.gifts.filter(g => g.id !== giftId)
    });
  };

  const calculateDaysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [month, day] = dateStr.split('-');
    const nextDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
    if (nextDate < today) {
      nextDate.setFullYear(today.getFullYear() + 1);
    }
    return Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [month, day] = dateStr.split('-');
    const date = new Date(2024, parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const PersonCard = ({ person }) => {
    const spent = person.gifts?.reduce((sum, g) => sum + (g.price || 0), 0) || 0;
    const daysUntil = calculateDaysUntil(person.birthday);
    const isExpanded = expandedPerson === person.id;

    return (
      <div key={person.id} className="mb-3 bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
        <button
          onClick={() => setExpandedPerson(isExpanded ? null : person.id)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-rose-50/50 transition"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{person.name}</h3>
            <p className="text-sm text-rose-600 font-medium">
              {formatDate(person.birthday)} • {daysUntil} days away
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 text-rose-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isExpanded && (
          <div className="border-t border-rose-100 p-4 bg-gradient-to-br from-rose-50/50 to-transparent space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-rose-100">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Budget</p>
                <input
                  type="number"
                  value={person.budget}
                  onChange={(e) => updatePerson(person.id, { budget: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xl font-bold text-rose-600 bg-transparent border-0 p-0 focus:outline-none"
                />
              </div>
              <div className="bg-white rounded-lg p-3 border border-rose-100">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Spent</p>
                <p className="text-xl font-bold text-gray-900">£{spent.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase text-gray-500 tracking-wide block mb-2">Notes</label>
              <textarea
                value={person.notes || ''}
                onChange={(e) => updatePerson(person.id, { notes: e.target.value })}
                placeholder="Add reminders, preferences..."
                className="w-full p-3 rounded-lg border border-rose-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-0 resize-none"
                rows="2"
              ></textarea>
            </div>

            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-3 font-medium">Gift Ideas</p>
              <div className="space-y-2">
                {person.gifts?.map(gift => (
                  <div key={gift.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-rose-100">
                    <button
                      onClick={() => updateGift(person.id, gift.id, { purchased: !gift.purchased })}
                      className={`mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition ${
                        gift.purchased ? 'bg-green-500 text-white' : 'border-2 border-gray-300 hover:border-rose-400'
                      }`}
                    >
                      {gift.purchased && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={gift.idea}
                        onChange={(e) => updateGift(person.id, gift.id, { idea: e.target.value })}
                        className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 p-0 focus:outline-none"
                      />
                      <input
                        type="number"
                        value={gift.price || ''}
                        onChange={(e) => updateGift(person.id, gift.id, { price: parseFloat(e.target.value) || 0 })}
                        placeholder="£0"
                        className="text-xs text-gray-500 bg-transparent border-0 p-0 focus:outline-none w-12"
                      />
                    </div>
                    <button
                      onClick={() => deleteGift(person.id, gift.id)}
                      className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addGift(person.id)}
                className="mt-3 w-full py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Gift Idea
              </button>
            </div>

            <button
              onClick={() => deletePerson(person.id)}
              className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition flex items-center justify-center gap-2 font-medium"
            >
              <Trash2 className="w-4 h-4" /> Remove Person
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { font-family: 'Poppins', sans-serif; }
      `}</style>

      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-rose-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-bold text-gray-900">Gift Tracker</h1>
          </div>
          <button
            onClick={addPerson}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full p-2 transition shadow-md"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {people.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No people yet. Add someone to get started!</p>
          </div>
        ) : (
          people.map(person => <PersonCard key={person.id} person={person} />)
        )}
      </div>
    </div>
  );
}
