export interface TestInteraction {
  init(): void,
  bark(): void,
  showAnswer(): void,
  isValid(): boolean,
}
