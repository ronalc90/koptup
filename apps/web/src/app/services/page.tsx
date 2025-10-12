'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  ShoppingCartIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  CloudIcon,
  CubeIcon,
  PaintBrushIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function ServicesPage() {
  const t = useTranslations();
  const ts = useTranslations('services');
  const tsp = useTranslations('servicesPage');

  const services = [
    {
      id: 'ecommerce',
      icon: ShoppingCartIcon,
      title: tsp('services.ecommerce.title'),
      shortDescription: tsp('services.ecommerce.shortDescription'),
      description: tsp('services.ecommerce.description'),
      features: tsp.raw('services.ecommerce.features') as string[],
      technologies: ['Next.js', 'Stripe', 'PayPal', 'WooCommerce', 'Shopify'],
      price: tsp('services.ecommerce.price'),
      deliveryTime: tsp('services.ecommerce.deliveryTime'),
    },
    {
      id: 'chatbots',
      icon: ChatBubbleBottomCenterTextIcon,
      title: tsp('services.chatbots.title'),
      shortDescription: tsp('services.chatbots.shortDescription'),
      description: tsp('services.chatbots.description'),
      features: tsp.raw('services.chatbots.features') as string[],
      technologies: ['OpenAI GPT', 'Dialogflow', 'Rasa', 'Node.js', 'Python'],
      price: tsp('services.chatbots.price'),
      deliveryTime: tsp('services.chatbots.deliveryTime'),
    },
    {
      id: 'integrations',
      icon: CubeIcon,
      title: tsp('services.integrations.title'),
      shortDescription: tsp('services.integrations.shortDescription'),
      description: tsp('services.integrations.description'),
      features: tsp.raw('services.integrations.features') as string[],
      technologies: ['Node.js', 'Express', 'GraphQL', 'REST', 'Redis'],
      price: tsp('services.integrations.price'),
      deliveryTime: tsp('services.integrations.deliveryTime'),
    },
    {
      id: 'custom',
      icon: CodeBracketIcon,
      title: tsp('services.custom.title'),
      shortDescription: tsp('services.custom.shortDescription'),
      description: tsp('services.custom.description'),
      features: tsp.raw('services.custom.features') as string[],
      technologies: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'MongoDB'],
      price: tsp('services.custom.price'),
      deliveryTime: tsp('services.custom.deliveryTime'),
    },
    {
      id: 'mobile',
      icon: DevicePhoneMobileIcon,
      title: tsp('services.mobile.title'),
      shortDescription: tsp('services.mobile.shortDescription'),
      description: tsp('services.mobile.description'),
      features: tsp.raw('services.mobile.features') as string[],
      technologies: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
      price: tsp('services.mobile.price'),
      deliveryTime: tsp('services.mobile.deliveryTime'),
    },
    {
      id: 'uxui',
      icon: PaintBrushIcon,
      title: tsp('services.uxui.title'),
      shortDescription: tsp('services.uxui.shortDescription'),
      description: tsp('services.uxui.description'),
      features: tsp.raw('services.uxui.features') as string[],
      technologies: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Principle'],
      price: tsp('services.uxui.price'),
      deliveryTime: tsp('services.uxui.deliveryTime'),
    },
    {
      id: 'security',
      icon: ShieldCheckIcon,
      title: tsp('services.security.title'),
      shortDescription: tsp('services.security.shortDescription'),
      description: tsp('services.security.description'),
      features: tsp.raw('services.security.features') as string[],
      technologies: ['OWASP', 'Burp Suite', 'Metasploit', 'SSL/TLS', 'WAF'],
      price: tsp('services.security.price'),
      deliveryTime: tsp('services.security.deliveryTime'),
    },
    {
      id: 'consulting',
      icon: CloudIcon,
      title: tsp('services.consulting.title'),
      shortDescription: tsp('services.consulting.shortDescription'),
      description: tsp('services.consulting.description'),
      features: tsp.raw('services.consulting.features') as string[],
      technologies: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform'],
      price: tsp('services.consulting.price'),
      deliveryTime: tsp('services.consulting.deliveryTime'),
    },
  ];

  const processSteps = [
    {
      number: '01',
      title: tsp('process.steps.consult.title'),
      description: tsp('process.steps.consult.description'),
    },
    {
      number: '02',
      title: tsp('process.steps.proposal.title'),
      description: tsp('process.steps.proposal.description'),
    },
    {
      number: '03',
      title: tsp('process.steps.design.title'),
      description: tsp('process.steps.design.description'),
    },
    {
      number: '04',
      title: tsp('process.steps.development.title'),
      description: tsp('process.steps.development.description'),
    },
    {
      number: '05',
      title: tsp('process.steps.testing.title'),
      description: tsp('process.steps.testing.description'),
    },
    {
      number: '06',
      title: tsp('process.steps.delivery.title'),
      description: tsp('process.steps.delivery.description'),
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {tsp('hero.badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {tsp('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-primary-100">
              {tsp('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50" asChild>
                <Link href="/contact">{tsp('hero.ctaConsult')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link href="/pricing">{tsp('hero.ctaPricing')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.id} variant="bordered" className="hover:shadow-large transition-shadow" id={service.id}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-primary-100 dark:bg-primary-950 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                        <CardDescription className="text-base">{service.shortDescription}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-secondary-700 dark:text-secondary-300">{service.description}</p>

                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-secondary-900 dark:text-white mb-3">{tsp('features')}</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-secondary-700 dark:text-secondary-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technologies */}
                    <div>
                      <h4 className="font-semibold text-secondary-900 dark:text-white mb-3">{tsp('technologies')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="secondary" size="sm">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Price & Delivery */}
                    <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          <span className="font-semibold text-secondary-900 dark:text-white">{service.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm text-secondary-700 dark:text-secondary-300">{service.deliveryTime}</span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href="/contact">{tsp('request')}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {tsp('process.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {tsp('process.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-secondary-600 dark:text-secondary-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <RocketLaunchIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {tsp('cta.title')}
          </h2>
          <p className="text-xl mb-10 text-primary-100">
            {tsp('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50" asChild>
              <Link href="/contact">{tsp('cta.ctaSchedule')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/pricing">{tsp('cta.ctaPricing')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
