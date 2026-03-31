export interface PortalUser { id: string; fullName: string; email: string; referralCode: string; walletBalance: number }
export interface Service { id: string; name: string; category: string; basePriceUsd: number; slug: string; shortDescription?: string; turnaroundDays?: number; icon?: string; featured: boolean }
export interface PortalOrder { id: string; orderId: number; serviceName: string; amountUsd: number; status: string; paymentStatus: string; orderDate: string; deadline?: string; deliveryLink?: string; quantity: number; revisionCount: number }
export interface WalletTx { id: string; type: string; amountUsd: number; balanceAfter: number; paymentMethod?: string; status: string; txDate: string }
export interface Commission { id: string; orderAmount: number; commissionAmount: number; status: string; holdReleaseDate?: string; createdAt: string }
