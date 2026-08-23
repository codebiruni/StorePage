export interface ICourierCredentials {
  // --- Pathao ---
  pathaoBaseUrl?: string;
  pathaoStoreId?: string;
  pathaoClientId?: string;
  pathaoClientSecret?: string;
  pathaoClientEmail?: string;
  pathaoClientPassword?: string;
  pathaoAccessToken?: string;
  pathaoRefreshToken?: string;
  pathaoTokenExpiresAt?: string; // ISO timestamp
  pathaoEnabled?: boolean;

  // --- Steadfast ---
  steadfastBaseUrl?: string;
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  steadfastEnabled?: boolean;

  // --- RedX ---
  redxBaseUrl?: string;
  redxStoreId?: string;
  redxApiToken?: string;
  redxEnabled?: boolean;
}

export interface ISiteInfo {
  number: string;
  email: string;
  name: string;
  logo: string;
  banner: {
    carousel: {
      image: string;
      link: string;
    }[];
    firstImage: {
      image?: string;
      link?: string;
    };
    secondImage: {
      image?: string;
      link?: string;
    };
  };
  socialContact: {
    facebook: string;
    youtube?: string;
    instagrame?: string;
    linkedIn?: string;
    whatsApp?: string;
    twitter?: string;
  };
  addresses: {
    name: string;
    address: string;
  }[];
  mapLink: string;
  footerLinks: {
    name: string;
    url: string;
  }[];
  marqueeText: string;
  courier?: ICourierCredentials;
}
