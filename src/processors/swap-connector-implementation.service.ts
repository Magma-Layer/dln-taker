import {
  ChainId,
  Jupiter,
  Logger,
  OneInch,
  SwapConnector,
  SwapConnectorQuoteRequest,
  SwapConnectorQuoteResult,
  SwapConnectorRequest,
  SwapConnectorResult,
} from '@debridge-finance/dln-client';
import { Connection } from '@solana/web3.js';

export class SwapConnectorImplementationService implements SwapConnector {
  readonly #connectors: { [key in ChainId]: SwapConnector | null };

  constructor(config: {
    oneInchApi: string;
    jupiterApiToken?: string;
    solanaConnection?: Connection;
  }) {
    const oneInchV4Connector = new OneInch.OneInchV4Connector(config.oneInchApi);
    const oneInchV5Connector = new OneInch.OneInchV5Connector(config.oneInchApi);

    this.#connectors = {
      [ChainId.Ethereum]: oneInchV4Connector,
      [ChainId.BSC]: oneInchV4Connector,
      [ChainId.Heco]: null,
      [ChainId.Polygon]: oneInchV4Connector,
      [ChainId.Arbitrum]: oneInchV4Connector,
      [ChainId.Avalanche]: oneInchV4Connector,
      [ChainId.AvalancheTest]: null,
      [ChainId.Kovan]: null,
      [ChainId.BSCTest]: null,
      [ChainId.HecoTest]: null,
      [ChainId.PolygonTest]: null,
      [ChainId.ArbitrumTest]: null,
      [ChainId.Solana]: null,
      [ChainId.Fantom]: oneInchV4Connector,
      [ChainId.Linea]: oneInchV4Connector,
      [ChainId.Base]: oneInchV5Connector,
      [ChainId.Optimism]: oneInchV4Connector,
    };

    if (config.solanaConnection) {
      this.initSolana({
        solanaConnection: config.solanaConnection,
        jupiterApiToken: config.jupiterApiToken,
      });
    }
  }

  initSolana(config: { jupiterApiToken?: string; solanaConnection: Connection }) {
    this.#connectors[ChainId.Solana] = new Jupiter.JupiterConnectorV6(
      config.solanaConnection,
      config.jupiterApiToken,
      19,
    );
  }

  getEstimate(
    request: SwapConnectorQuoteRequest,
    context: { logger: Logger },
  ): Promise<SwapConnectorQuoteResult> {
    return this.#getConnector(request.chainId).getEstimate(request, context);
  }

  getSupportedChains(): ChainId[] {
    return Object.keys(this.#connectors)
      .map((chainId) => chainId as unknown as ChainId)
      .filter((chainId) => this.#connectors[chainId] !== null);
  }

  getSwap(
    request: SwapConnectorRequest,
    context: { logger: Logger },
  ): Promise<SwapConnectorResult> {
    return this.#getConnector(request.chainId).getSwap(request, context);
  }

  setSupportedChains(chains: ChainId[]): void {
    Object.keys(this.#connectors)
      .map((chainId) => chainId as unknown as ChainId)
      .filter((chainId) => !chains.includes(chainId))
      .forEach((chainId) => this.#connectors[chainId] === null);
  }

  #getConnector(chainId: ChainId): SwapConnector {
    const connector = this.#connectors[chainId];
    if (connector === null) {
      throw new Error(`Unsupported chain in swap connector`);
    }

    return connector;
  }
}
