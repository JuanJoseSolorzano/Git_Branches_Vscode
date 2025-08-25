const vscode = require('vscode')
const path = require('path');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.ShowGitBranches', async () => {
        const git = vscode.extensions.getExtension('vscode.git');
        if (!git) {
            vscode.window.showErrorMessage('Git extension not found.');
            return;
        }
        await git.activate();
        const api = git.exports.getAPI(1);
        const repos = api.repositories;
        if (repos.length === 0) {
            vscode.window.showInformationMessage('No git repositories found.');
            return;
        }
        // Show branches for each repo
        for (const repo of repos) {
            try {
                const branches = await repo.getBranches({ remote: true });
                const branchNames = Array.from( new Set( branches
                            .map(branch => branch.name.replace(/^origin\//, ''))
                            .filter(name => name !== 'HEAD'))).sort();
                const repoName = path.basename(repo.rootUri.fsPath);
                const selectedBranch = await vscode.window.showQuickPick(branchNames, {
                    placeHolder: `Select a branch to checkout (${repoName})`
                });
                if (selectedBranch) {
                    // checkout to the selected branch
                    await repo.checkout(selectedBranch);
                    vscode.window.showInformationMessage(`Checked out to "${selectedBranch}"`);
                }
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to get branches for ${repo.rootUri.fsPath}`);
            }
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
