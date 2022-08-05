# v3.1.0
[2022-08-05]

### Features

* feat: changed the order of data-attribute is processed to be able to use when the component script is executed ([`4cb7661`](https://github.com/bouerjs/bouer/commit/4cb76615dfd11fed5864d14ce321753459986b8f))
* feat: added findDirective function ([`32926d8`](https://github.com/bouerjs/bouer/commit/32926d8d913e41a6bb93689cab1cb20ba17701d2))
* feat: added test package.json version updater ([`3bc3416`](https://github.com/bouerjs/bouer/commit/3bc341602aad48109d7394054e7fd9f35dd7aa9b))
* feat: changed the way the directive is retrieved ([`9ce067f`](https://github.com/bouerjs/bouer/commit/9ce067f5d63a2c7df5231ff15bb4bb1fa4555353))
* feat: Enabled multiple html element insertion using template with html delimiter {{:html [...] }} ([`9f4ff1d`](https://github.com/bouerjs/bouer/commit/9f4ff1deb12903ad979f58257afd351df8153e46))
* feat: added npm pack and script to update test package.json ([`ca45838`](https://github.com/bouerjs/bouer/commit/ca45838723d1d4d62c17a670e4cc40942f7cf1ec))

### Fixes

* fix: fixed {{: html [...] }} bug on rendering the html snippet ([`729fc7c`](https://github.com/bouerjs/bouer/commit/729fc7c84075a0f75aca0fd206423abc6c49b581))

# v3.1.0
[2022-06-28]

### Features

* feat: removed empty CustomDirective from Compiler instantiation ([`020ac9b`](https://github.com/bouerjs/bouer/commit/020ac9b0ef9595290ec3c43fb6c26bf4023b10eb))
* feat: added destroy method the event result to be able to destroy the event without using off method ([`bdfc3bb`](https://github.com/bouerjs/bouer/commit/bdfc3bbffe0e424b72e6fc1e336d5b9cde03e98d))
* feat: made CustomDirective injection optional ([`8071395`](https://github.com/bouerjs/bouer/commit/80713959344ad6780a0597d592d5947d31c47612))
* feat: added destroy property to the interface ([`f3f0652`](https://github.com/bouerjs/bouer/commit/f3f0652da042abfb33543269fec87545b9c44b6e))
* feat: handle method to compile ([`f25d2f9`](https://github.com/bouerjs/bouer/commit/f25d2f960208d7015539490236c484a7c841688b))

### Fixes

* fix: added globalData to the Evalutor ([`b139b4c`](https://github.com/bouerjs/bouer/commit/b139b4c41c42eb8fe892e70aa76040dc44e9efbd))
* fix: fixed route mapping issue ([`c0a891b`](https://github.com/bouerjs/bouer/commit/c0a891b47421d8a179061be586c87db6883ee52a))
* fix: updated single comment ([`efffe79`](https://github.com/bouerjs/bouer/commit/efffe7983b2d22c489b2e82d94515a9d64befec5))

# v3.0.0
[2022-03-28]

### Features

* * style: code formatting to match eslint config ([`62f116e`](https://github.com/bouerjs/bouer/commit/62f116ef50aca062cd7c03a3086494f9d47b4e5c))
* feat: new feature as ([`c674ea8`](https://github.com/bouerjs/bouer/commit/c674ea8185f335fb6381325dbb68fb0b6ae5bc61))
* feat: added shorthand attribuite check ([`6598cf6`](https://github.com/bouerjs/bouer/commit/6598cf656ddc50a0ac5510bdbf3c7ad2bb4963e7))
* feat: added eslint for code formatting ([`da7002a`](https://github.com/bouerjs/bouer/commit/da7002a9183791c0b38ba70730bfd5ceea44989c))
* feat: updated the Bouer Object ([`19e629a`](https://github.com/bouerjs/bouer/commit/19e629acf6a3c966376796ca3958808a54160f31))
* feat: added the `ifNullStop` function and added `child` to $CreateEl and refactor $CreateAnyEl function ([`519e869`](https://github.com/bouerjs/bouer/commit/519e869b05ec55c6606361b18680fa5d9498c2e8))
* feat: force function call if it's a promise and return a function; ([`4fdbabc`](https://github.com/bouerjs/bouer/commit/4fdbabcbf9855a8bdb353aeb4e744d497c5819ce))
* feat: added an specific context on wait-data ([`996270b`](https://github.com/bouerjs/bouer/commit/996270ba12809042c34d22d8ab1bc2d12835968c))
* feat: added `toJsObj` static method to .d.ts ([`3fcb414`](https://github.com/bouerjs/bouer/commit/3fcb41464ae10552b331859550f7dcd3781afad7))
* feat: added `Binder.remove` method to be able to remove binds manually and autoUnbind check ([`58b415f`](https://github.com/bouerjs/bouer/commit/58b415f1787af34ed31d4c15b351ee0f58ca9b16))
* feat: added app element verification perform before perform certain action ([`48c8e0c`](https://github.com/bouerjs/bouer/commit/48c8e0cdbb102944c2c365247a632e1949648a31))
* feat: added the new methods of the Bouer class ([`72178de`](https://github.com/bouerjs/bouer/commit/72178de33435594e2094a5e6728370cc1dd62a7a))
* feat: added compiler isConnected function checker for binder handling ([`1288f18`](https://github.com/bouerjs/bouer/commit/1288f1877130f08d4f72432ce15ea4c73855c096))
* feat: added `unbind` method ([`d0cf93b`](https://github.com/bouerjs/bouer/commit/d0cf93bc4cb0a783509586cb4d47bccd066c8afb))
* feat: added `unbind` method ([`8a0d2fa`](https://github.com/bouerjs/bouer/commit/8a0d2faff26618c3e4d9fb8b34a5b7530690da76))
* feat: added event type checker ([`c92daaa`](https://github.com/bouerjs/bouer/commit/c92daaa8be035b47a11e422baf832b04452aff54))
* feat: added isConnected function to the compilation processes of a node ([`9a797a4`](https://github.com/bouerjs/bouer/commit/9a797a48277f9b374f5679e6fcebb48a10ebbda7))
* feat: added a remove logic check and added `autoOffEvent` for manually remove event ([`0ba687e`](https://github.com/bouerjs/bouer/commit/0ba687e8e694f0c0631a6ce2b812365f99e5572c))
* feat: enable return value instead of function to a computed properties ([`81a34c2`](https://github.com/bouerjs/bouer/commit/81a34c2eebfc45b0ef5d7a1d2bf9905ab3236552))
* feat: run onDone function as promise ([`fe8900a`](https://github.com/bouerjs/bouer/commit/fe8900aec6e45f9c31f66caed668d62ed6b78abb))
* feat: added `fnCall` function to resolve Promises ([`271e2b0`](https://github.com/bouerjs/bouer/commit/271e2b0e77dd3c89432519ddb4b6cf95ca660022))
* feat: added pre-push hook ([`a566959`](https://github.com/bouerjs/bouer/commit/a566959dd22f56035c0a5f4967bc70553e0e9e6b))
* feat: added jest in `jsconfig` file ([`f90784f`](https://github.com/bouerjs/bouer/commit/f90784faa1ac43cf58e6154774b740de766190ef))
* feat: added `autoUnbind` and `autoOffEvent` property config ([`422dcc1`](https://github.com/bouerjs/bouer/commit/422dcc195bd0d3de761f9dfe6d07e990f9e11269))
* feat: added the context in watch method ([`6181d55`](https://github.com/bouerjs/bouer/commit/6181d5527250feb7485a201acf27a9900158493e))
* feat: added app element verification perform clear action ([`a931ab1`](https://github.com/bouerjs/bouer/commit/a931ab17fcbbe8ee6213048f9ae6e1b096778517))
* feat: added Extend class to the global export ([`7fa6b31`](https://github.com/bouerjs/bouer/commit/7fa6b31d39bc0f369fedc7c9bb408309da3e500a))
* feat: return bouer instance for chaining ([`4498ebd`](https://github.com/bouerjs/bouer/commit/4498ebdaae0c3ed87eb06b2f7afc2bf962187610))
* feat: added comment text on creation ([`19dc4c6`](https://github.com/bouerjs/bouer/commit/19dc4c67ee3aaa4dea5c054dcd1c587e8328d509))
* feat: Added the context to the computed property get an set ([`a559d11`](https://github.com/bouerjs/bouer/commit/a559d11cc2ad5fef8e8b4a9f22427e582bee0c09))
* feat: added husky hooks to the project ([`98025e8`](https://github.com/bouerjs/bouer/commit/98025e826035a6a730a50833e8d6c4be82c25e86))
* feat: added `autoComponentDestroy` to IBouerConfig ([`d8c237e`](https://github.com/bouerjs/bouer/commit/d8c237e7dbc36b14f9c423dba8285013a013b73e))
* feat: added the example folder ([`e6bb47a`](https://github.com/bouerjs/bouer/commit/e6bb47a9443f3719c17ecf3ddb0c865758ba8031))
* feat: made global element search for `htmlToJsObj` function ([`bf8f7b7`](https://github.com/bouerjs/bouer/commit/bf8f7b783e08205621f74cec2099547c2c311b1c))
* feat: added `autoComponentDestroy` component autoDestroy verification ([`77df19c`](https://github.com/bouerjs/bouer/commit/77df19c4e3952a8f745ab4be1ea1fc5bcaccb184))
* feat: enabled Promise in event subscription callback ([`c659b5e`](https://github.com/bouerjs/bouer/commit/c659b5e95f20ea74c2a14f258dddcae3f40e9bcb))
* feat: added $mixin to the evaluation scope ([`7e95bca`](https://github.com/bouerjs/bouer/commit/7e95bca20f9f7eee984b8fb48279569424a65973))
* feat: added new rule to eslint ([`46e5ddb`](https://github.com/bouerjs/bouer/commit/46e5ddb8a07df5feb7eeb224a684614398731ef7))
* feat: added @types/jest ([`38a1c6b`](https://github.com/bouerjs/bouer/commit/38a1c6ba28b2d784d8ec08f849a553100dbab25c))

### Fixes

* fix: fixed e-for where-filter bug when the filter value changes. ([`8a8e0cf`](https://github.com/bouerjs/bouer/commit/8a8e0cfe1d2bb4430273aa1d50ec4666971d460a))
* fix: added a warning for component with non `name` and `path` ([`e8da074`](https://github.com/bouerjs/bouer/commit/e8da07426596d7feb0ed53e8f0848282ba748833))
* fix: computed property bind value ([`95eca3d`](https://github.com/bouerjs/bouer/commit/95eca3d8171d6d17e2a6f9606c3d206fcb28e34d))
* fix: fixed the event execution ([`c6da820`](https://github.com/bouerjs/bouer/commit/c6da820a4ee0579ac369f5f38eab3e2862db107c))
* fix: fixed computed inferred get bug on set ([`6397422`](https://github.com/bouerjs/bouer/commit/6397422399eefb4681b7bec8fbaeacc35ceab5ec))
* fix: bug in the reactive scope, preventing various watches to the same property ([`4731c24`](https://github.com/bouerjs/bouer/commit/4731c24b35a151f6a9a1944debb064b0a3bc3778))
* fix: fixed fail on event dispatch on e-req element ([`0041323`](https://github.com/bouerjs/bouer/commit/0041323ed2cacc692c227fbc2ff03c0351c43f63))
* fix: fixed previuos page navigation ([`4201a90`](https://github.com/bouerjs/bouer/commit/4201a906fc8d7ad131ff89bad0f1e55f78d3aa0a))
* fix: fixing husky git hooks ([`c4ca47b`](https://github.com/bouerjs/bouer/commit/c4ca47bd08defb7d0e70953e3ce9cf9db8e0585e))
* fix: fixed a bug on component link (style) auto remove when combined with `e-for` ([`6ce9da1`](https://github.com/bouerjs/bouer/commit/6ce9da16a1941b6e888cc2caba86b1733e36816a))
* fix: verification of the path before requesting the component ([`a4e9ace`](https://github.com/bouerjs/bouer/commit/a4e9aced53fc5d17bf3fa92a06b2f9b5b11cf100))
* fix: fixed `onPropertyInScopeChange` return value ([`29b2e84`](https://github.com/bouerjs/bouer/commit/29b2e84e0356370bc99b38cf5ebc1097935e1a6e))
* fix: fixing husky git hooks ([`0d39293`](https://github.com/bouerjs/bouer/commit/0d39293c465789fb12929f37da1b9b0bc10add46))
* fix: applied the best pratice of setting and getting the prototype ([`6574656`](https://github.com/bouerjs/bouer/commit/65746563a90b26bc79ceb7afde5a6e93ecd860c0))
* fix: fixing husky git hooks ([`165213d`](https://github.com/bouerjs/bouer/commit/165213dc4b25f7b559159431dfb7f22130f542f1))
* fix: fixing husky git hooks ([`66c5e82`](https://github.com/bouerjs/bouer/commit/66c5e82adb8a595472db57d091164d2f40bffe28))
* fix: fixing husky git hooks ([`5b65a05`](https://github.com/bouerjs/bouer/commit/5b65a05520b205cf5b9615e1d7ba1db412c5d9b3))
* fix: fixed lint error ([`3691349`](https://github.com/bouerjs/bouer/commit/36913497297b21e5fb10b0b47a0a5c7ba9532715))
* fix: ignored .husky folder ([`fa53cfc`](https://github.com/bouerjs/bouer/commit/fa53cfce31c5e134b68d98b9d5a95f561edea310))
* fix: disabled the debugger eslint error ([`ec09b7c`](https://github.com/bouerjs/bouer/commit/ec09b7cfa4ac1ddeacd30f847eb1cfaf2e8eadc2))
