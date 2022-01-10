import { LitElement } from 'lit';
import { connect } from '@captaincodeman/rdx';
import { store } from '../store';

export class Connected extends connect(store, LitElement) {}

export * from '../store';
