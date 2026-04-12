# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e5]
    - paragraph [ref=e19]:
      - text: Welcome to your dashboard! This is where site admins will log in to manage your store. Customers will need to
      - link "log in to the site instead" [ref=e20] [cursor=pointer]:
        - /url: http://localhost:3000/login
      - text: to access their user account, order history, and more.
    - generic [ref=e21]:
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]:
            - text: Email
            - generic [ref=e25]: "*"
          - textbox "Email *" [ref=e27]
        - generic [ref=e28]:
          - generic [ref=e29]:
            - text: Password
            - generic [ref=e30]: "*"
          - textbox "Password" [ref=e33]
      - link "Forgot password?" [ref=e34] [cursor=pointer]:
        - /url: /admin/forgot
      - button "Login" [ref=e36] [cursor=pointer]:
        - generic:
          - generic: Login
  - status [ref=e37]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e43] [cursor=pointer]:
    - img [ref=e44]
  - alert [ref=e47]: Login - Payload
```