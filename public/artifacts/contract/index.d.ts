import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  initializeTreasury(context: __compactRuntime.CircuitContext<PS>,
                     initialBalance_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           zonesHash_0: Uint8Array,
           totalAmount_0: bigint,
           nonce_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitShuffleSeed(context: __compactRuntime.CircuitContext<PS>,
                    seedHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revealAndSettle(context: __compactRuntime.CircuitContext<PS>,
                  revealedZonesHash_0: Uint8Array,
                  drawnCardRank_0: bigint,
                  drawnCardSuit_0: bigint,
                  totalPayout_0: bigint,
                  recipient_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  initializeTreasury(context: __compactRuntime.CircuitContext<PS>,
                     initialBalance_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           zonesHash_0: Uint8Array,
           totalAmount_0: bigint,
           nonce_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitShuffleSeed(context: __compactRuntime.CircuitContext<PS>,
                    seedHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revealAndSettle(context: __compactRuntime.CircuitContext<PS>,
                  revealedZonesHash_0: Uint8Array,
                  drawnCardRank_0: bigint,
                  drawnCardSuit_0: bigint,
                  totalPayout_0: bigint,
                  recipient_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  initializeTreasury(context: __compactRuntime.CircuitContext<PS>,
                     initialBalance_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  placeBet(context: __compactRuntime.CircuitContext<PS>,
           zonesHash_0: Uint8Array,
           totalAmount_0: bigint,
           nonce_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitShuffleSeed(context: __compactRuntime.CircuitContext<PS>,
                    seedHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revealAndSettle(context: __compactRuntime.CircuitContext<PS>,
                  revealedZonesHash_0: Uint8Array,
                  drawnCardRank_0: bigint,
                  drawnCardSuit_0: bigint,
                  totalPayout_0: bigint,
                  recipient_0: { bytes: Uint8Array }): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly houseBalance: bigint;
  readonly betCommitment: Uint8Array;
  readonly lastNonce: bigint;
  readonly seedCommitment: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
