'use client';

import { useState, useEffect, RefObject } from 'react';

/**
 * Hook personalizado que detecta el color de fondo de un elemento
 * y determina automáticamente si usar texto claro u oscuro para mantener contraste.
 *
 * @param elementRef - Referencia al elemento que se quiere analizar
 * @param options - Opciones de configuración
 * @returns Objeto con el color sugerido para el texto y si el fondo es oscuro
 */
export function useAutoContrast(
  elementRef: RefObject<HTMLElement>,
  options?: {
    updateInterval?: number; // Intervalo de actualización en ms (default: 100ms)
    lightColor?: string; // Color para fondos oscuros (default: '#ffffff')
    darkColor?: string; // Color para fondos claros (default: '#000000')
  }
) {
  const {
    updateInterval = 100,
    lightColor = '#ffffff',
    darkColor = '#000000',
  } = options || {};

  const [textColor, setTextColor] = useState<string>(darkColor);
  const [isDarkBackground, setIsDarkBackground] = useState<boolean>(false);

  useEffect(() => {
    if (!elementRef.current) return;

    /**
     * Convierte un color RGB a luminancia relativa según WCAG
     * https://www.w3.org/TR/WCAG20/#relativeluminancedef
     */
    const getLuminance = (r: number, g: number, b: number): number => {
      // Normalizar valores RGB (0-255 a 0-1)
      const [rs, gs, bs] = [r, g, b].map((val) => {
        const normalized = val / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : Math.pow((normalized + 0.055) / 1.055, 2.4);
      });

      // Calcular luminancia relativa
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    /**
     * Extrae los valores RGB de un color en cualquier formato
     */
    const getRGBFromColor = (color: string): [number, number, number] | null => {
      // Crear un elemento temporal para obtener el color computado
      const temp = document.createElement('div');
      temp.style.color = color;
      document.body.appendChild(temp);

      const computedColor = window.getComputedStyle(temp).color;
      document.body.removeChild(temp);

      // Extraer valores RGB del formato "rgb(r, g, b)" o "rgba(r, g, b, a)"
      const match = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      }

      return null;
    };

    /**
     * Detecta el color de fondo efectivo del elemento
     * (busca en el elemento y sus padres hasta encontrar un color sólido)
     */
    const getEffectiveBackgroundColor = (element: HTMLElement): string => {
      let current: HTMLElement | null = element;

      while (current) {
        const style = window.getComputedStyle(current);
        const bgColor = style.backgroundColor;

        // Si el color no es transparente, usarlo
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          return bgColor;
        }

        // Subir al elemento padre
        current = current.parentElement;
      }

      // Si llegamos hasta el body sin encontrar color, asumir blanco
      return 'rgb(255, 255, 255)';
    };

    /**
     * Actualiza el color del texto basado en el fondo
     */
    const updateTextColor = () => {
      if (!elementRef.current) return;

      const bgColor = getEffectiveBackgroundColor(elementRef.current);
      const rgb = getRGBFromColor(bgColor);

      if (!rgb) {
        // Si no se puede determinar el color, usar el color oscuro por defecto
        setTextColor(darkColor);
        setIsDarkBackground(false);
        return;
      }

      const [r, g, b] = rgb;
      const luminance = getLuminance(r, g, b);

      // Threshold de luminancia: 0.5 (valores más altos = fondo claro)
      // Ajustado a 0.179 para mejor contraste según WCAG
      const isDark = luminance < 0.179;

      setIsDarkBackground(isDark);
      setTextColor(isDark ? lightColor : darkColor);
    };

    // Actualizar inmediatamente
    updateTextColor();

    // Observar cambios en el DOM (clases, estilos, etc.)
    const observer = new MutationObserver(updateTextColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true,
    });

    // Observar cambios en el elemento específico
    if (elementRef.current) {
      observer.observe(elementRef.current, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    // Actualizar periódicamente por si hay cambios dinámicos
    const interval = setInterval(updateTextColor, updateInterval);

    // Actualizar en cambios de tamaño de ventana
    window.addEventListener('resize', updateTextColor);
    window.addEventListener('scroll', updateTextColor);

    // Cleanup
    return () => {
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('resize', updateTextColor);
      window.removeEventListener('scroll', updateTextColor);
    };
  }, [elementRef, updateInterval, lightColor, darkColor]);

  return {
    textColor,
    isDarkBackground,
  };
}
