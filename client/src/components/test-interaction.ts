export interface TestInteraction extends HTMLElement {
  init(): void,
  bark(): void,
  showAnswer(): void,
  isValid(): boolean,
}
