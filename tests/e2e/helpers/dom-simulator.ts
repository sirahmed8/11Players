/**
 * DOM Simulator helper for E2E user interactions in JSDOM.
 */

// 1. User Actions
export const clickElement = (element: HTMLElement) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};

export const typeText = (input: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

export const selectDropdown = (select: HTMLSelectElement, value: string) => {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};

export const adjustSlider = (input: HTMLInputElement, value: number) => {
  input.value = value.toString();
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

export const toggleCheckbox = (input: HTMLInputElement, checked: boolean) => {
  input.checked = checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

// 2. Form Fills
export interface BioData {
  name: string;
  dob: string; // YYYY-MM-DD
  height: number;
  weight: number;
  preferredFoot: 'Left' | 'Right' | 'Both';
}

export const fillBioForm = (container: HTMLElement, data: BioData) => {
  const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
  const dobInput = container.querySelector('input[name="dob"]') as HTMLInputElement;
  const heightInput = container.querySelector('input[name="height"]') as HTMLInputElement;
  const weightInput = container.querySelector('input[name="weight"]') as HTMLInputElement;
  const footSelect = container.querySelector('select[name="preferredFoot"]') as HTMLSelectElement;

  if (nameInput) typeText(nameInput, data.name);
  if (dobInput) typeText(dobInput, data.dob);
  if (heightInput) typeText(heightInput, data.height.toString());
  if (weightInput) typeText(weightInput, data.weight.toString());
  if (footSelect) selectDropdown(footSelect, data.preferredFoot);
};

export interface AttributesData {
  speed: number;
  dribbling: number;
  passing: number;
  shooting: number;
  defense: number;
  stamina: number;
}

export const fillAttributesForm = (container: HTMLElement, data: AttributesData, skills: string[]) => {
  // Fill sliders
  Object.entries(data).forEach(([key, val]) => {
    const slider = container.querySelector(`input[name="${key}"]`) as HTMLInputElement;
    if (slider) adjustSlider(slider, val);
  });

  // Check skills
  skills.forEach(skill => {
    const checkbox = container.querySelector(`input[value="${skill}"]`) as HTMLInputElement;
    if (checkbox) toggleCheckbox(checkbox, true);
  });
};

// 3. Pitch Picker SVG Zone Clicking
export const clickPitchZone = (container: HTMLElement, positionCode: string): boolean => {
  const zone = container.querySelector(`[data-position="${positionCode}"]`) || 
               Array.from(container.querySelectorAll('svg *')).find(el => el.textContent === positionCode);
  if (zone) {
    clickElement(zone as HTMLElement);
    return true;
  }
  return false;
};

// 4. Language & Theme Validation State Helpers
export const getLanguageState = (): { lang: string; dir: string } => {
  const lang = localStorage.getItem('language') || 'en';
  const dir = document.documentElement.getAttribute('dir') || 'ltr';
  return { lang, dir };
};

export const setLanguageState = (lang: 'en' | 'ar') => {
  localStorage.setItem('language', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
};

export const getThemeState = (): string => {
  return localStorage.getItem('theme') || 'light';
};

export const setThemeState = (theme: 'light' | 'dark') => {
  localStorage.setItem('theme', theme);
  const classList = document.documentElement.classList;
  if (theme === 'dark') {
    classList.add('dark');
  } else {
    classList.remove('dark');
  }
};
