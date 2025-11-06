interface User {
  readonly dbId: number
  email: string,
  userId: number,
  googleId?: string
  startTrial: () => string
  getCoupon(coupon: string): number
}

const joe: User = {dbId: 69, email: "ha@ha.com", userId: 8008}
startTrail: () => {
  return "trail started"
};
getCoupon: (name: "goku", off: 10) => {
  return 10
}