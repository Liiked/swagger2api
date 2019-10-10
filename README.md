# swagger2api( alpha )

Quickly converting api document to usable Front-End code.

## How to use

1. Open a swagger json file, press LIGHTING icon.

![images/open-swagger.png](https://tva1.sinaimg.cn/large/006y8mN6gy1g7t6c3l60ig30xs0guhbv.gif)

2. Edit code template in normal Javascript file just as you like!

![images/edit-file.png](https://tva1.sinaimg.cn/large/006y8mN6gy1g7t6dzv0jjg30xs0gujzi.gif)

3. Press button again, if everything goes successfully, just check `exportApi` fold in your workspace.

![images/export-file.png](https://tva1.sinaimg.cn/large/006y8mN6gy1g7t6irsn16g30xs0guqc7.gif)

## Limitation

For security reason, there are some constraints for users.
- Since user can modify the file which later will be excuted by this plugin and in case of any unfunctional or unexpected code injected to plugin runtime, the tempalte file must only export one given function, you could only write your help function inside the given scope. Once you didn't follow this rule, error will occur.
