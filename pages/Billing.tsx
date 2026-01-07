import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/ui';
import { Check, CreditCard, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Billing = () => {
  const { t } = useLanguage();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['5 Devices', 'Basic Automation', '1 Day History', 'Community Support'],
      current: false
    },
    {
      name: 'Pro',
      price: '$12',
      period: '/mo',
      features: ['Unlimited Devices', 'Advanced Scripting', '30 Days History', 'Priority Support', 'Remote Access'],
      current: true
    },
    {
      name: 'Enterprise',
      price: '$49',
      period: '/mo',
      features: ['Dedicated Hub', 'SLA 99.9%', 'Unlimited History', 'API Access', 'White Label'],
      current: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('nav.billing')}</h1>
        <p className="text-slate-400">Manage your subscription and payment methods</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative border-slate-800 bg-slate-900/50 ${plan.current ? 'border-indigo-500/50 ring-1 ring-indigo-500/50' : ''}`}>
            {plan.current && (
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
                <Badge variant="success" className="px-3 py-1">Current Plan</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {plan.name}
                {plan.name === 'Pro' && <Zap className="w-5 h-5 text-yellow-400 fill-current" />}
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center text-sm text-slate-300">
                    <Check className="w-4 h-4 mr-2 text-emerald-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Button 
                variant={plan.current ? 'outline' : 'default'} 
                className={`w-full ${plan.current ? 'border-indigo-500 text-indigo-400' : ''}`}
                disabled={plan.current}
              >
                {plan.current ? 'Active' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <CreditCard className="w-5 h-5" /> Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center text-xs font-bold text-white">VISA</div>
            <div>
              <p className="text-white font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-slate-500">Expires 12/25</p>
            </div>
          </div>
          <Button variant="ghost" className="text-indigo-400">Edit</Button>
        </CardContent>
      </Card>
    </div>
  );
};